import {
  ChatInputCommandInteraction,
  DiscordAPIError,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { getBotVC, getStore, getUserVC } from "../../utils/memory.ts";

class BotInVCError extends Error {
  constructor() {
    super("El bot ya esta en un VC");
    this.name = "BotInVCError";
    Object.setPrototypeOf(this, BotInVCError.prototype);
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Hace que el bot se una al vc"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const store = getStore(interaction);

      if (await getBotVC(interaction)) throw new BotInVCError();

      const userVC = await getUserVC(interaction);
      if (!userVC) throw new Error("UserVC is null");

      const connection = joinVoiceChannel({
        channelId: userVC.id,
        guildId: userVC.guildId,
        adapterCreator: userVC.guild.voiceAdapterCreator,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
      connection.subscribe(store.player);

      await interaction.editReply("Conectado.");
    } catch (error) {
      if (error instanceof DiscordAPIError) console.error(error);
      if (error instanceof BotInVCError) {
        await interaction.reply({
          content: "Ya estoy en un VC.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.reply({
        content: "Connectate a un VC primero.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
