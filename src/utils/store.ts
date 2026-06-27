import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  AudioPlayer,
  createAudioPlayer,
  createAudioResource,
  StreamType,
} from "@discordjs/voice";
import { Playlist, Song } from "../playlist/playlist.ts";
import { NotInGuildError } from "../errors/errors.ts";
import * as music from "../playlist/playlist.ts";
import { Readable } from "node:stream";

export interface Store {
  list: Playlist;
  player: AudioPlayer;
  currentSong: Song | null;
  listenerActive: boolean;
}

const guilds = new Map<string, Store>();

export function getGuildState(guildId: string): Store {
  const store = guilds.get(guildId);
  if (!store) {
    const newStore: Store = {
      list: new Playlist(),
      player: createAudioPlayer(),
      currentSong: null,
      listenerActive: false,
    };
    newStore.player.on("error", console.error);
    guilds.set(guildId, newStore);
    return newStore;
  }
  return store;
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

export function playNextSong(store: Store) {
  store.currentSong = store.list.songs[0];
  const webStream = music.getAudioSource(store.currentSong.url);
  const nodeStream = Readable.from(webStream);
  const audioResource = createAudioResource(nodeStream, {
    inputType: StreamType.WebmOpus,
  });
  store.player.play(audioResource);
}
