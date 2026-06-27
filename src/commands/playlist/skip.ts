import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import {
  getStore,
  playNextSong,
  userAndBotInSameVC,
} from "../../utils/store.ts";
import { UserNotInSameVCError } from "../../errors/errors.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Pasa a la siguiente canción."),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!(await userAndBotInSameVC(interaction)))
      throw new UserNotInSameVCError();

    const store = getStore(interaction);

    if (store.list.songs.length <= 1)
      throw "No hay suficientes canciones en la playlist";

    store.list.remove(0);
    playNextSong(store);
    await interaction.reply("Skipped.");
  },
};
