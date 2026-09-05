import { AudioPlayerStatus } from "@discordjs/voice";
import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { getStore, userAndBotInSameVC } from "../../utils/store.js";
import { USER_VC_ERROR, userDiscordError } from "../../utils/user-error.js";

export default {
	data: new SlashCommandBuilder()
		.setName("remove")
		.setDescription("Remueve una canción")
		.addNumberOption((option) =>
			option
				.setName("id")
				.setDescription("ID de la canción a eliminar.")
				.setRequired(true),
		),
	execute: async (interaction: ChatInputCommandInteraction) => {
		const userInVC = await userAndBotInSameVC(interaction);
		if (!userInVC) {
			await userDiscordError(interaction, USER_VC_ERROR);
			return;
		}

		const store = getStore(interaction);

		const id = interaction.options.getNumber("id");
		if (id === null) throw "ID no encotrada en opciones";
		if (id === 0 && store.player.state.status === AudioPlayerStatus.Playing) {
			await interaction.reply("No puedes borrar la canción en reproducción");
			return;
		}

		if (store.list.songs.length > 0) {
			store.list.remove(id);
			await interaction.reply(store.list.display());
		}
	},
};
