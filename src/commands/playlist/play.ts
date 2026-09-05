import { AudioPlayerStatus } from "@discordjs/voice";
import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import {
	getStore,
	playNextSong,
	type Store,
	userAndBotInSameVC,
} from "../../utils/store.js";
import {
	EMPTY_PLAYLIST,
	USER_VC_ERROR,
	userDiscordError,
} from "../../utils/user-error.js";

function setupPlayerListener(
	store: Store,
	interaction: ChatInputCommandInteraction,
) {
	store.player.on("stateChange", async (oldState, newState) => {
		if (
			oldState.status === AudioPlayerStatus.Playing &&
			newState.status === AudioPlayerStatus.Idle
		) {
			if (store.list.songs.length > 0) {
				store.list.remove(0);
				if (store.list.songs.length > 0) {
					try {
						playNextSong(store);
					} catch (err) {
						await userDiscordError(interaction, err as string);
						return;
					}
				} else {
					store.currentSong = undefined;
				}
			}
		}
	});
}

export default {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("Inicia la reproducción."),
	execute: async (interaction: ChatInputCommandInteraction) => {
		const userInVC = await userAndBotInSameVC(interaction);
		if (!userInVC) {
			await userDiscordError(interaction, USER_VC_ERROR);
			return;
		}

		const store = getStore(interaction);

		if (!store.listenerActive) {
			setupPlayerListener(store, interaction);
			store.listenerActive = true;
		}

		if (store.list.songs.length === 0) {
			await userDiscordError(interaction, EMPTY_PLAYLIST);
			return;
		}

		await interaction.deferReply();

		if (store.player.state.status === AudioPlayerStatus.Paused) {
			store.player.unpause();
			await interaction.followUp("Reproduciondo audio.");
		} else if (store.player.state.status === AudioPlayerStatus.Playing) {
			userDiscordError(interaction, "El audio ya se está reproduciendo.");
		} else {
			playNextSong(store);
			await interaction.followUp("Reproduciondo audio.");
		}
	},
};
