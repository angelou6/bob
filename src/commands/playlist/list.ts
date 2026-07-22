import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getStore } from "../../utils/store.js";

export default {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("Muestra la lista de reproducción."),
  async execute(interaction: ChatInputCommandInteraction) {
    const store = getStore(interaction);
    await interaction.reply(store.list.display());
  },
};
