import { AudioPlayerStatus } from "@discordjs/voice";
import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { getStore, userAndBotInSameVC } from "../../utils/store.js";
import { USER_VC_ERROR, userDiscordError } from "../../utils/user-error.js";

export default {
	data: new SlashCommandBuilder()
		.setName("shuffle")
		.setDescription("Re ordenar aleatoriamente la lista de reproducción."),
	async execute(interaction: ChatInputCommandInteraction) {
		if (await userAndBotInSameVC(interaction)) {
			const store = getStore(interaction);
			store.list.shuffle(
				store.player.state.status === AudioPlayerStatus.Playing,
			);
			await interaction.reply(store.list.display());
		} else {
			await userDiscordError(interaction, USER_VC_ERROR);
		}
	},
};
