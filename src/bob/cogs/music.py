import subprocess
from io import BufferedIOBase
from typing import cast
from venv import logger

import discord
from discord.ext import commands
from discord.ui.button import V
from discord.ui.item import ViewItem
from discord.voice import VoiceClient

from bob import store
from bob.errors import (
    BOT_VC_ERROR,
    EMPTY_PLAYLIST,
    SAME_VC,
    USER_VC,
    URLError,
    user_error,
)
from bob.playlist import platform, song, youtube
from bob.playlist.playlist import Playlist


class YTDLPSource(discord.FFmpegPCMAudio):
    def __init__(self, url: str):
        self.ytdlp = subprocess.Popen(
            [
                "yt-dlp",
                "-f",
                "bestaudio",
                "--no-playlist",
                "-q",
                "-o",
                "-",
                url,
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )

        stdout = self.ytdlp.stdout
        assert stdout is not None

        super().__init__(
            cast(BufferedIOBase, stdout),
            pipe=True,
            options="-vn",
        )

    def cleanup(self):
        super().cleanup()
        if self.ytdlp.poll() is None:
            self.ytdlp.kill()
        if self.ytdlp.stdout is not None:
            self.ytdlp.stdout.close()


def play_song(vc: VoiceClient, song: song.Song, callback):
    def after(error):
        if error:
            print(f"Player error: {error}")
        callback()

    vc.play(YTDLPSource(song.url), after=after)


def play_next(vc: VoiceClient, p: Playlist):
    del p.songs[0]

    if len(p.songs) > 0:
        p.current_song = p.songs[0]
        play_song(vc, p.current_song, lambda: play_next(vc, p))


async def get_author_voice(ctx: discord.ApplicationContext):
    if not isinstance(ctx.author, discord.Member) or not ctx.author.voice:
        await user_error(ctx, USER_VC)
        return

    return ctx.author.voice.channel


async def in_same_vc(ctx) -> bool:
    channel = await get_author_voice(ctx)
    if channel is None:
        await user_error(ctx, USER_VC)
        return False

    return ctx.voice_client.channel == channel


class AcceptStyle(discord.ui.View):
    def __init__(
        self,
        *items: ViewItem[V],
        timeout: float | None = 5,
        disable_on_timeout: bool = False,
        store: bool = True,
        playlist: Playlist,
        delete_songs: list[song.Song],
    ):
        self.playlist = playlist
        self.songs = delete_songs
        super().__init__(
            *items, timeout=timeout, disable_on_timeout=disable_on_timeout, store=store
        )

    async def on_timeout(self):
        if self.message:
            await self.message.edit(view=None)

    @discord.ui.button(label="Cancelar", style=discord.ButtonStyle.danger, emoji="✖️")
    async def cancell_callback(self, button, interaction):
        if not self.message:
            logger.error("No message was found to delete.")
            return await interaction.response.send_message("Hubo un error inesperado.")

        for s in self.songs:
            self.playlist.songs.remove(s)
        await self.message.delete()


class Music(commands.Cog):
    add = discord.SlashCommandGroup("add", "Añade una canción a la playlist")

    def __init__(self, bot) -> None:
        self.bot = bot

    # TODO FIX:
    # For some reason the bot takes a lot of time actually entering the VC
    # however, in the Discord UI it joins instantly
    # If the user does anything voice related before it's propperly connected, it silently fails.
    # Yippie...
    @discord.slash_command(description="Hace que el bot se una al VC", guild_only=True)
    async def join(self, ctx: discord.ApplicationContext):
        await ctx.defer()

        channel = await get_author_voice(ctx)
        if channel is None:
            return await user_error(ctx, USER_VC)

        if ctx.voice_client:
            await user_error(ctx, BOT_VC_ERROR)
        else:
            await channel.connect()
            await ctx.respond(f"Conectado en el canal {channel.mention}")

    @discord.slash_command(description="Hace que el bot salga del VC", guild_only=True)
    async def leave(self, ctx: discord.ApplicationContext):
        if not await in_same_vc(ctx):
            return await user_error(ctx, SAME_VC)

        if ctx.voice_client:
            await ctx.voice_client.disconnect()
            await ctx.respond("Bye Bye.", ephemeral=True)
        else:
            await user_error(ctx, "No estoy en un canal de voz.")

    @discord.option("urls", str, description="URLs a añadir, separadas por espacios")
    @add.command(
        name="url",
        description="URLs a añadir, separadas por espacios",
    )
    async def add_url(self, ctx: discord.ApplicationContext, urls: str):
        await ctx.defer()

        if not await in_same_vc(ctx):
            return await user_error(ctx, SAME_VC)

        p = store.get_playlist(ctx)
        try:
            found = []
            for url in urls.split():
                found = platform.find_songs(url)
                for s in found:
                    p.add(s)
            await ctx.respond(
                platform.format_songs(found),
                view=AcceptStyle(delete_songs=found, playlist=p),
            )
        except URLError as e:
            await ctx.respond(e.message)

    @discord.option("query", str, description="Busca una canción")
    @add.command(name="query", description="Busca una canción mediante YouTube Music")
    async def add_query(self, ctx: discord.ApplicationContext, query: str):
        await ctx.defer()

        if not await in_same_vc(ctx):
            return await user_error(ctx, SAME_VC)

        try:
            p = store.get_playlist(ctx)
            s = youtube.search(query)
            p.add(s)
            await ctx.respond(
                platform.format_songs([s]),
                view=AcceptStyle(delete_songs=[s], playlist=p),
            )
        except URLError as e:
            await ctx.respond(e.message)

    @discord.slash_command(description="Inicia la reproducción")
    async def play(self, ctx: discord.ApplicationContext):
        if not await in_same_vc(ctx):
            return await user_error(ctx, SAME_VC)

        p = store.get_playlist(ctx)
        if len(p.songs) == 0:
            return await user_error(ctx, EMPTY_PLAYLIST)

        vc = ctx.voice_client
        if not vc:
            return await user_error(ctx, "No estoy en un VC")

        if vc.is_playing():
            return await user_error(ctx, "El audio ya se está reproduciendo")
        elif vc.is_paused():
            vc.resume()
        else:
            p.current_song = p.songs[0]
            play_song(vc, p.current_song, lambda: play_next(vc, p))
        await ctx.respond("Reproduciondo audio.", ephemeral=True)

    @discord.slash_command(description="Detiene la reproducción.")
    async def pause(self, ctx: discord.ApplicationContext):
        if not await in_same_vc(ctx):
            return await user_error(ctx, SAME_VC)

        vc = ctx.voice_client
        if not vc:
            return await user_error(ctx, "No estoy en un VC")

        if vc.is_paused():
            await user_error(ctx, "El audio ya está pausado.")
        else:
            vc.pause()
            await ctx.respond("Audio pausado.", ephemeral=True)

    @discord.slash_command(
        description="Re ordenar aleatoriamente la lista de reproducción."
    )
    async def shuffle(self, ctx: discord.ApplicationContext):
        if not await in_same_vc(ctx):
            return await user_error(ctx, SAME_VC)

        p = store.get_playlist(ctx)
        if len(p.songs) == 0:
            return await user_error(ctx, EMPTY_PLAYLIST)

        vc = ctx.voice_client
        if not vc:
            return await user_error(ctx, "No estoy en un VC")

        p.shuffle(skip_first=vc.is_playing())
        await ctx.respond(p.display())

    @discord.slash_command(description="Pasa a la siguiente canción")
    async def skip(self, ctx: discord.ApplicationContext):
        p = store.get_playlist(ctx)
        if len(p.songs) < 2:
            return await user_error(ctx, "No hay suficientes canciones.")

        vc = ctx.voice_client
        if not vc:
            return await user_error(ctx, "No estoy en un VC")

        await ctx.respond("Skipped", ephemeral=True)
        vc.stop()

    @discord.option("id", int, description="ID de la canción a eliminar")
    @discord.slash_command(description="Remueve una canción")
    async def remove(self, ctx: discord.ApplicationContext, id: int):
        if not await in_same_vc(ctx):
            return await user_error(ctx, SAME_VC)

        p = store.get_playlist(ctx)
        try:
            vc = ctx.voice_client
            if id == 0 and vc and vc.is_playing():
                return await user_error(
                    ctx, "No puedes borrar la canción en reproducción"
                )
            await ctx.respond(f"Canción {p.songs[id].title} removida de la playlist.")
            p.remove(id)
        except IndexError:
            await user_error(ctx, "ID no encotrada en opciones")

    @discord.option("origin", int, description="ID de la canción a mover")
    @discord.option("to", int, description="ID del lugar de destino")
    @discord.slash_command(description="Mueve una canción de lugar")
    async def move(self, ctx: discord.ApplicationContext, origin: int, to: int):
        if not await in_same_vc(ctx):
            return await user_error(ctx, SAME_VC)

        try:
            p = store.get_playlist(ctx)
            p.move(origin, to)
            await ctx.respond(p.display)
        except IndexError:
            await user_error(ctx, "ID invalida.")

    @discord.slash_command(description="Muestra la lista de reproducción.")
    async def list(self, ctx: discord.ApplicationContext):
        p = store.get_playlist(ctx)
        await ctx.respond(p.display())


def setup(bot):
    bot.add_cog(Music(bot))
