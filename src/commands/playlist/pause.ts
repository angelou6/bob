import { AudioPlayerStatus } from "@discordjs/voice";
import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { getStore, userAndBotInSameVC } from "../../utils/store.js";
import {
	EMPTY_PLAYLIST,
	USER_VC_ERROR,
	userDiscordError,
} from "../../utils/user-error.js";

export default {
	data: new SlashCommandBuilder()
		.setName("pause")
		.setDescription("Detiene la reproducción."),
	execute: async (interaction: ChatInputCommandInteraction) => {
		const userInVC = await userAndBotInSameVC(interaction);
		if (!userInVC) {
			await userDiscordError(interaction, USER_VC_ERROR);
			return;
		}

		const store = getStore(interaction);

		if (store.list.songs.length === 0) {
			await userDiscordError(interaction, EMPTY_PLAYLIST);
			return;
		}

		if (store.player.state.status === AudioPlayerStatus.Paused) {
			await userDiscordError(interaction, "El audio ya está pausado.");
		} else {
			store.player.pause();
			await interaction.reply("Audio pausado.");
		}
	},
};
