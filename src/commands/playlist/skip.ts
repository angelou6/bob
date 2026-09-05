import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import {
	getStore,
	playNextSong,
	userAndBotInSameVC,
} from "../../utils/store.js";
import { USER_VC_ERROR, userDiscordError } from "../../utils/user-error.js";

export default {
	data: new SlashCommandBuilder()
		.setName("skip")
		.setDescription("Pasa a la siguiente canción."),
	execute: async (interaction: ChatInputCommandInteraction) => {
		if (await userAndBotInSameVC(interaction)) {
			const store = getStore(interaction);
			if (store.list.songs.length <= 1) {
				throw "No hay suficientes canciones en la playlist";
			}

			store.list.remove(0);
			try {
				playNextSong(store);
			} catch (err) {
				await userDiscordError(interaction, err as string);
				return;
			}
			await interaction.reply("Skipped.");
		} else {
			await userDiscordError(interaction, USER_VC_ERROR);
		}
	},
};
