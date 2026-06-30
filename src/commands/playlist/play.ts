import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import {
  getStore,
  playNextSong,
  Store,
  userAndBotInSameVC,
} from "../../utils/store.ts";
import { AudioPlayerStatus } from "@discordjs/voice";
import { UnImportantError, UserNotInSameVCError } from "../../errors/errors.ts";

function setupPlayerListener(store: Store) {
  store.player.on("stateChange", (oldState, newState) => {
    if (
      oldState.status === AudioPlayerStatus.Playing &&
      newState.status === AudioPlayerStatus.Idle
    ) {
      if (store.list.songs.length > 0) {
        store.list.remove(0);
        if (store.list.songs.length > 0) {
          playNextSong(store);
        } else {
          store.currentSong = null;
        }
      }
    }
  });
}

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Inicia la reproducción."),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!(await userAndBotInSameVC(interaction))) {
      throw new UserNotInSameVCError();
    }

    const store = getStore(interaction);

    if (!store.listenerActive) {
      setupPlayerListener(store);
      store.listenerActive = true;
    }

    if (store.list.songs.length === 0) {
      throw "No hay canciones en la playlist";
    }

    await interaction.deferReply();

    if (store.player.state.status === AudioPlayerStatus.Paused) {
      store.player.unpause();
      await interaction.followUp("Reproduciondo audio.");
    } else if (store.player.state.status === AudioPlayerStatus.Playing) {
      throw new UnImportantError("El audio ya se está reproduciendo.");
    } else {
      playNextSong(store);
      await interaction.followUp("Reproduciondo audio.");
    }
  },
};
