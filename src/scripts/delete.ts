import { ApplicationCommand, REST, Routes } from "discord.js";

const TOKEN = Deno.env.get("DISCORD_TOKEN");
const APP_ID = Deno.env.get("APP_ID");
const GUILD_ID = Deno.env.get("GUILD_ID");

const target = Deno.args[0];

if (TOKEN && APP_ID) {
  const rest = new REST().setToken(TOKEN);

  try {
    console.log("Intentando borrar slash commands");
    const data = [];
    if (target === "local") {
      if (!GUILD_ID) throw "GUILD ID no encontrada en el enviroment.";
      data.push(
        (await rest.put(Routes.applicationGuildCommands(APP_ID, GUILD_ID), {
          body: [],
        })) as ApplicationCommand,
      );
    } else if (target === "global") {
      data.push(
        (await rest.put(Routes.applicationCommands(APP_ID), {
          body: [],
        })) as ApplicationCommand,
      );
    } else {
      throw "Uso incorrecto. Uso: deno run delete <local|global>";
    }
    console.log(`Borrado exitoso. Comandos borrados ${data.length}`);
  } catch (error) {
    console.error(error);
  }
} else {
  console.error("Token o App ID no encotrados en el enviroment");
}
