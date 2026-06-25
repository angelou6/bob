import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getGuildState } from "../store.ts";

class NotInGuildError extends Error {
  constructor() {
    super("Este commando solo puede ser ejecutado en una guild.");
    this.name = "NotInGuildError";
    Object.setPrototypeOf(this, NotInGuildError.prototype);
  }
}

export function getStore(interaction: ChatInputCommandInteraction) {
  const guildID = interaction.guildId;
  if (guildID === null) throw "No guild encontrada";
  return getGuildState(guildID);
}

async function getVC(member: GuildMember) {
  try {
    await member.voice.fetch();
    return member.voice.channel;
  } catch (_) {
    return null;
  }
}

export async function getUserVC(interaction: ChatInputCommandInteraction) {
  if (!interaction.inCachedGuild()) throw new NotInGuildError();
  return await getVC(interaction.member);
}

export async function getBotVC(interaction: ChatInputCommandInteraction) {
  if (!interaction.inCachedGuild()) throw new NotInGuildError();
  const member = interaction.guild.members.me;
  if (member === null) throw "BotMember es Null";
  return await getVC(member);
}

export async function userAndBotInSameVC(
  interaction: ChatInputCommandInteraction,
) {
  const userVC = await getUserVC(interaction);
  const botVC = await getBotVC(interaction);
  return userVC != null && botVC != null && userVC === botVC;
}
