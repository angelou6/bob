import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";
import {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { getBotVC, getStore, getUserVC } from "../../utils/store.ts";
import { BotInVCError, UserNotInVCError } from "../../errors/errors.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Hace que el bot se una al vc"),
  async execute(interaction: ChatInputCommandInteraction) {
    const store = getStore(interaction);

    if (await getBotVC(interaction)) throw new BotInVCError();

    const userVC = await getUserVC(interaction);
    if (!userVC) throw new UserNotInVCError();

    const connection = joinVoiceChannel({
      channelId: userVC.id,
      guildId: userVC.guildId,
      adapterCreator: userVC.guild.voiceAdapterCreator,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    connection.subscribe(store.player);

    await interaction.reply({
      content: "Conectado.",
      flags: MessageFlags.Ephemeral,
    });
  },
};
