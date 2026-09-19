import discord

USER_VC = "Connectate a un VC primero."
BOT_VC_ERROR = "Ya estoy en un VC."
SAME_VC = "Necesitamos estar en el mismo VC."
EMPTY_PLAYLIST = "No hay canciones en la playlist"


async def user_error(ctx: discord.ApplicationContext, msg: str):
    await ctx.respond("❌ " + msg, ephemeral=True)


class GuildError(Exception):
    def __init__(self, message: str, ctx: discord.ApplicationContext) -> None:
        self.ctx = ctx
        super().__init__(message)


class URLError(Exception):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)
