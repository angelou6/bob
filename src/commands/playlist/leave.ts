import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { getStore, userAndBotInSameVC } from "../../utils/store.ts";
import { UnImportantError } from "../../errors/errors.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Hace que el bot se salga del vc"),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) {
      throw new UnImportantError("Este comando solo puede correr en un Guild");
    }

    const store = getStore(interaction);

    const connection = getVoiceConnection(interaction.guildId);
    if (connection) {
      if (!(await userAndBotInSameVC(interaction))) {
        throw new UnImportantError("Necesitas estar en el mismo VC que yo.");
      }

      store.player.removeAllListeners("stateChange");
      store.listenerActive = false;
      connection.destroy();
      await interaction.reply({
        content: "Bye.",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      throw new UnImportantError("No estoy en un canal de voz.");
    }
  },
};
