import { AudioPlayerStatus } from "@discordjs/voice";
import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { getStore, userAndBotInSameVC } from "../../utils/store.js";
import { USER_VC_ERROR, userDiscordError } from "../../utils/user-error.js";

export default {
	data: new SlashCommandBuilder()
		.setName("move")
		.setDescription("Mueve una canción de lugar.")
		.addNumberOption((option) =>
			option
				.setName("from")
				.setDescription("ID de la canción a mover.")
				.setRequired(true),
		)
		.addNumberOption((option) =>
			option
				.setName("to")
				.setDescription("ID del lugar de destino.")
				.setRequired(true),
		),
	execute: async (interaction: ChatInputCommandInteraction) => {
		const userInVC = await userAndBotInSameVC(interaction);
		if (!userInVC) {
			await userDiscordError(interaction, USER_VC_ERROR);
			return;
		}

		const store = getStore(interaction);

		const from = interaction.options.getNumber("from");
		const to = interaction.options.getNumber("to");
		if (from === null || to === null) throw "ID no encotrada en opciones";
		if (
			(from === 0 || to === 0) &&
			store.player.state.status === AudioPlayerStatus.Playing
		) {
			await interaction.reply("No puedes borrar la canción en reproducción");
			return;
		}

		if (store.list.songs.length > 0) {
			store.list.move(from, to);
			await interaction.reply(store.list.display());
		}
	},
};
