import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";
import { getStore, userAndBotInSameVC } from "../../utils/store.ts";
import { UserNotInSameVCError } from "../../errors/errors.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remueve una canción")
    .addNumberOption((option) =>
      option
        .setName("id")
        .setDescription("ID de la canción a eliminar.")
        .setRequired(true)
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!(await userAndBotInSameVC(interaction))) {
      throw new UserNotInSameVCError();
    }

    const store = getStore(interaction);

    const id = interaction.options.getNumber("id");
    if (id === null) throw "ID no encotrada en opciones";
    if (id === 0 && store.player.state.status === AudioPlayerStatus.Playing) {
      await interaction.reply("No puedes borrar la canción en reproducción");
      return;
    }

    if (store.list.songs.length > 0) {
      store.list.remove(id);
      await interaction.reply(store.list.display());
    }
  },
};
