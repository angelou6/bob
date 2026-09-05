import { getVoiceConnection } from "@discordjs/voice";
import {
	type ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { getStore, userAndBotInSameVC } from "../../utils/store.js";
import { userDiscordError } from "../../utils/user-error.js";

export default {
	data: new SlashCommandBuilder()
		.setName("leave")
		.setDescription("Hace que el bot se salga del vc"),
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) {
			userDiscordError(
				interaction,
				"Este comando solo puede correr en un Guild",
			);
			return;
		}

		const store = getStore(interaction);

		const connection = getVoiceConnection(interaction.guildId);
		if (connection) {
			const sameVC = await userAndBotInSameVC(interaction);
			if (!sameVC) {
				userDiscordError(interaction, "Necesitas estar en el mismo VC que yo.");
				return;
			}

			store.player.removeAllListeners("stateChange");
			store.listenerActive = false;
			connection.destroy();
			await interaction.reply({
				content: "Bye.",
				flags: MessageFlags.Ephemeral,
			});
		} else {
			userDiscordError(interaction, "No estoy en un canal de voz.");
		}
	},
};
