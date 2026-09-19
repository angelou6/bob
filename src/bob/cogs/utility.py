import discord
from discord.ext import commands


class Utility(commands.Cog):
    def __init__(self, bot) -> None:
        self.bot = bot

    @discord.slash_command(description="Ping Pong!")
    async def ping(self, ctx):
        await ctx.respond("Pong!")

    @discord.slash_command(description="Obtener el código del bot")
    async def source(self, ctx):
        await ctx.respond("https://github.com/angelou6/bob")


def setup(bot):
    bot.add_cog(Utility(bot))
