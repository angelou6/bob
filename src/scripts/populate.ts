import { ApplicationCommand, REST, Routes } from "discord.js";
import { getCommandsFiles } from "../utils/files.ts";

const TOKEN = Deno.env.get("DISCORD_TOKEN");
const APP_ID = Deno.env.get("APP_ID");
const GUILD_ID = Deno.env.get("GUILD_ID");

const target = process.argv[2];

const commands = [];
for (const file of await getCommandsFiles()) {
  const command = await import(file).then((command) => command.default);
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`The command at ${file} is incomplete`);
  }
}

if (TOKEN && APP_ID) {
  const rest = new REST().setToken(TOKEN);

  try {
    console.log(`Intentando refrescar ${commands.length} slash commands`);
    const data = [];
    if (target === "local") {
      if (!GUILD_ID) throw "GUILD ID no encontrada en el enviroment.";
      data.push(
        (await rest.put(Routes.applicationGuildCommands(APP_ID, GUILD_ID), {
          body: commands,
        })) as ApplicationCommand,
      );
    } else if (target === "global") {
      data.push(
        (await rest.put(Routes.applicationCommands(APP_ID), {
          body: commands,
        })) as ApplicationCommand,
      );
    } else {
      throw "Uso incorrecto. Uso: deno run populate <local|global>";
    }
    console.log(`Refresh existoso. Comandos refrescados ${data.length}`);
  } catch (error) {
    console.error(error);
  }
} else {
  console.error("Token o App ID no encotrados en el enviroment");
}
