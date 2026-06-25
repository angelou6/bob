import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { getStore, userAndBotInSameVC } from "../../utils/memory.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Hace que el bot se salga del vc"),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const store = getStore(interaction);

    const connection = getVoiceConnection(interaction.guildId);
    if (connection) {
      if (!(await userAndBotInSameVC(interaction))) {
        await interaction.reply({
          content: "Necesitas estar en el mismo VC que yo",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      store.player.removeAllListeners("stateChange");
      store.listenerActive = false;
      connection.destroy();
      await interaction.reply({
        content: "Reply para que discord no se ponga a llorar.",
      });
    } else {
      await interaction.reply({
        content: "No estoy en un canal de voz",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
