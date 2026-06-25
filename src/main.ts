import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  type CacheType,
  type Interaction,
  MessageFlags,
} from "discord.js";
import { getCommandsFiles } from "./utils/files.ts";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
client.commands = new Collection();

for (const file of await getCommandsFiles()) {
  const command = await import(file).then((command) => command.default);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`El comando en ${file} está incompleto.`);
  }
}

client.on(
  Events.InteractionCreate,
  async (interaction: Interaction<CacheType>) => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No hay comando coincidente para ${interaction.commandName} fué encontrado.`,
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: `❌ ${error}`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: `❌ ${error}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Client ready uwu. ${readyClient.user.tag}`);
});

client.login(Deno.env.get("DISCORD_TOKEN"));
