import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";
import { getStore, userAndBotInSameVC } from "../../utils/store.ts";
import { UserNotInSameVCError } from "../../errors/errors.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("move")
    .setDescription("Mueve una canción de lugar.")
    .addNumberOption((option) =>
      option
        .setName("from")
        .setDescription("ID de la canción a mover.")
        .setRequired(true),
    )
    .addNumberOption((option) =>
      option
        .setName("to")
        .setDescription("ID del lugar de destino.")
        .setRequired(true),
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!(await userAndBotInSameVC(interaction)))
      throw new UserNotInSameVCError();

    const store = getStore(interaction);

    const from = interaction.options.getNumber("from");
    const to = interaction.options.getNumber("to");
    if (from === null || to === null) throw "ID no encotrada en opciones";
    if (
      (from === 0 || to === 0) &&
      store.player.state.status === AudioPlayerStatus.Playing
    ) {
      await interaction.reply("No puedes borrar la canción en reproducción");
      return;
    }

    if (store.list.songs.length > 0) {
      store.list.move(from, to);
      await interaction.reply(store.list.display());
    }
  },
};
