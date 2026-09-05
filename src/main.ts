import { pathToFileURL } from "node:url";
import {
	type CacheType,
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	type Interaction,
} from "discord.js";
import { getCommandsFiles } from "./utils/files.js";

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
client.commands = new Collection();

for (const file of await getCommandsFiles()) {
	const command = await import(pathToFileURL(file).href).then((c) => c.default);
	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.warn(`El commando en ${file} está incompleto`);
	}
}

client.on(
	Events.InteractionCreate,
	async (interaction: Interaction<CacheType>) => {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);
		if (command === undefined) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
		}
	},
);

client.once(Events.ClientReady, (readyClient) => {
	console.log("Client ready uwu. ", readyClient.user.tag);
});

client.login(process.env.DISCORD_TOKEN);
