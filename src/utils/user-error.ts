import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";

type CustomError = string;

export const USER_VC_ERROR: CustomError = "Connectate a un VC primero.";
export const BOT_VC_ERROR: CustomError = "Ya estoy en un VC.";
export const EMPTY_PLAYLIST: CustomError = "No hay canciones en la playlist";

export async function userDiscordError(
	interaction: ChatInputCommandInteraction,
	message: CustomError | string,
) {
	await interaction.reply({
		content: `❌ ${message}`,
		flags: MessageFlags.Ephemeral,
	});
}
