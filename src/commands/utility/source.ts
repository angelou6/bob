import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("source")
    .setDescription("Obtener el código del bot"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("Aún no está disponible");
  },
};
