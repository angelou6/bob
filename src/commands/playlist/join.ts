import {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { BotInVCError, UserNotInVCError } from "../../errors/errors.js";
import { getBotVC, getStore, getUserVC } from "../../utils/store.js";

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

    await interaction.reply(`Conectado en el canal ${userVC}`);
  },
};
