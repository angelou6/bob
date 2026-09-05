import {
	entersState,
	joinVoiceChannel,
	VoiceConnectionStatus,
} from "@discordjs/voice";
import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { getBotVC, getStore, getUserVC } from "../../utils/store.js";
import {
	BOT_VC_ERROR,
	USER_VC_ERROR,
	userDiscordError,
} from "../../utils/user-error.js";

export default {
	data: new SlashCommandBuilder()
		.setName("join")
		.setDescription("Hace que el bot se una al vc"),
	async execute(interaction: ChatInputCommandInteraction) {
		const store = getStore(interaction);

		if (await getBotVC(interaction)) {
			await userDiscordError(interaction, BOT_VC_ERROR);
			return;
		}

		const userVC = await getUserVC(interaction);
		if (!userVC) {
			await userDiscordError(interaction, USER_VC_ERROR);
			return;
		}

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
