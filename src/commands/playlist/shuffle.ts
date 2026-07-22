import { AudioPlayerStatus } from "@discordjs/voice";
import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { UserNotInSameVCError } from "../../errors/errors.js";
import { getStore, userAndBotInSameVC } from "../../utils/store.js";

export default {
	data: new SlashCommandBuilder()
		.setName("shuffle")
		.setDescription("Re ordenar aleatoriamente la lista de reproducción."),
	async execute(interaction: ChatInputCommandInteraction) {
		if (!(await userAndBotInSameVC(interaction))) {
			throw new UserNotInSameVCError();
		}

		const store = getStore(interaction);
		if (store.player.state.status === AudioPlayerStatus.Playing) {
			store.list.semiShuffle();
		} else {
			store.list.fullShuffle();
		}
		await interaction.reply(store.list.display());
	},
};
