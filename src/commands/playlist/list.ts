import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getStore } from "../../utils/store.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("Muestra la lista de reproducción."),
  async execute(interaction: ChatInputCommandInteraction) {
    const store = getStore(interaction);
    await interaction.reply(store.list.display());
  },
};
