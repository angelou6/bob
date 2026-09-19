import discord

from bob.errors import GuildError
from bob.playlist.playlist import Playlist

GUILDS: dict[int, Playlist] = {}


def get_playlist(ctx: discord.ApplicationContext) -> Playlist:
    id = ctx.guild_id
    if id is None:
        raise GuildError("Error getting guild ID", ctx)

    playlist = GUILDS.get(id)
    if playlist is None:
        playlist = GUILDS[id] = Playlist()
    return playlist
