import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getStore, userAndBotInSameVC } from "../../utils/store.ts";
import { AudioPlayerStatus } from "@discordjs/voice";
import { UnImportantError, UserNotInSameVCError } from "../../errors/errors.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Detiene la reproducción."),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!(await userAndBotInSameVC(interaction)))
      throw new UserNotInSameVCError();

    const store = getStore(interaction);

    if (store.list.songs.length === 0) {
      throw "No hay canciones en la playlist";
    }

    if (store.player.state.status === AudioPlayerStatus.Paused) {
      throw new UnImportantError("El audio ya está pausado.");
    } else {
      store.player.pause();
      await interaction.reply("Audio pausado.");
    }
  },
};
