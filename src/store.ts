import { AudioPlayer, createAudioPlayer } from "@discordjs/voice";
import { Playlist, Song } from "./playlist/playlist.ts";

interface Store {
  list: Playlist;
  player: AudioPlayer;
  currentSong: Song | null;
}

const guilds = new Map<string, Store>();

export function getGuildState(guildId: string): Store {
  const store = guilds.get(guildId);
  if (!store) {
    const newStore: Store = {
      list: new Playlist(),
      player: createAudioPlayer(),
      currentSong: null,
    };
    newStore.player.on("error", console.error);
    guilds.set(guildId, newStore);
    return newStore;
  }
  return store;
}
