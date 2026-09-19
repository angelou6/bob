import os

import discord

intents = discord.Intents.default()
intents.guilds = True
intents.voice_states = True
bot = discord.Bot(intents=intents)


@bot.event
async def on_ready():
    print(f"Client ready uwu. {bot.user}")


def main() -> None:
    bot.load_extension("bob.cogs.music")
    bot.load_extension("bob.cogs.utility")
    bot.run(os.getenv("DISCORD_TOKEN"))
