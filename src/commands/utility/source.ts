import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("source")
    .setDescription("Obtener el código del bot"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("https://github.com/angelou6/bob");
  },
};
