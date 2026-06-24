import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName("ping").setDescription("Ping Pong!"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("pong!");
  },
};
