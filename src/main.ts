import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  type CacheType,
  type Interaction,
} from "discord.js";
import { getCommandsFiles } from "./utils/files.ts";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
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
          content: "Error ejecutando ese comando",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "Error ejecutando ese comando",
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
