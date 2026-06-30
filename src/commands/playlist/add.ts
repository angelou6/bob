import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import { getStore, userAndBotInSameVC } from "../../utils/store.ts";
import * as music from "../../playlist/playlist.ts";
import { UserNotInSameVCError } from "../../errors/errors.ts";

function formatBatchConfirmation(songs: music.Song[]): string {
  const header = songs.length === 1
    ? "Se eñadio la canción"
    : `se añadieron ${songs.length} canciones`;

  return [
    header,
    ...songs.map((song, index) => `${index + 1}. ${song.title}\n${song.url}`),
  ].join("\n");
}

async function createConfirmButtonCollector(
  interaction: ChatInputCommandInteraction<CacheType>,
  content: string,
) {
  const cancel = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Cancelar")
    .setStyle(ButtonStyle.Danger);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel);

  await interaction.reply({
    content,
    components: [row],
  });

  const response = await interaction.fetchReply();

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 10_000,
  });

  collector.on("end", (collected) => {
    if (collected.size === 0) interaction.editReply({ components: [] });
  });

  return collector;
}

export default {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Añade una canción a la playlist.")
    .addSubcommand((sub) =>
      sub
        .setName("url")
        .setDescription(
          "Añade una o más canciones con URLs de spotify o YouTube separadas por espacios.",
        )
        .addStringOption((option) =>
          option
            .setName("url")
            .setDescription("URLs a añadir, separadas por espacios.")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("query")
        .setDescription("Busca una canción mediante YouTube Music.")
        .addStringOption((option) =>
          option
            .setName("query")
            .setDescription("Query de busqueda.")
            .setRequired(true)
        )
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!(await userAndBotInSameVC(interaction))) {
      throw new UserNotInSameVCError();
    }

    const store = getStore(interaction);
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "url": {
        const url = interaction.options.getString("url");
        if (url === null) throw "URL no encotrada en opciones";

        const songs = await music.songsfromUrl(url);

        for (const song of songs) {
          store.list.add(song);
        }
        const collector = await createConfirmButtonCollector(
          interaction,
          formatBatchConfirmation(songs),
        );

        collector.on("collect", async (i) => {
          if (i.customId === "cancel") {
            for (const song of songs) {
              store.list.removeFromSong(song);
            }
            await i.update({
              content: songs.length === 1
                ? "Se removió la cancion"
                : `Se removieron ${songs.length} canciones`,
              components: [],
            });
          }
        });

        break;
      }

      case "query": {
        const query = interaction.options.getString("query");
        if (query === null) throw "URL no encotrada en opciones";

        const song = await music.search(query);
        store.list.add(song);
        const collector = await createConfirmButtonCollector(
          interaction,
          song.url,
        );

        collector.on("collect", async (i) => {
          if (i.customId === "cancel") {
            store.list.removeFromSong(song);
            await i.update({
              content: "Se removió la canción",
              components: [],
            });
          }
        });
        break;
      }

      default:
        throw `El commando ${subcommand} no existe.`;
    }
  },
};
