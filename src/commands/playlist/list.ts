import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import * as music from "../../playlist/playlist.ts";
import { getStore, userAndBotInSameVC } from "../../utils/memory.ts";
import {
  AudioPlayerStatus,
  createAudioResource,
  StreamType,
} from "@discordjs/voice";
import { Readable } from "node:stream";
import { Store } from "../../store.ts";

function parseUrlsFromInput(value: string): string[] {
  return value
    .split(/\s+/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function formatBatchConfirmation(songs: music.Song[]): string {
  const header =
    songs.length === 1
      ? "¿Es esta la canción que quieres añadir?"
      : `¿Son estas las ${songs.length} canciones que quieres añadir?`;

  return [
    header,
    ...songs.map((song, index) => `${index + 1}. ${song.title}\n${song.url}`),
  ].join("\n");
}

async function createConfirmButtonCollector(
  interaction: ChatInputCommandInteraction<CacheType>,
  content: string,
) {
  const confirm = new ButtonBuilder()
    .setCustomId("confirm")
    .setLabel("Confirmar")
    .setStyle(ButtonStyle.Primary);
  const cancel = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Cancelar")
    .setStyle(ButtonStyle.Secondary);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    cancel,
    confirm,
  );

  await interaction.reply({
    content,
    components: [row],
    flags: MessageFlags.Ephemeral,
  });

  const response = await interaction.fetchReply();

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30_000,
  });

  return collector;
}

function playNextSong(store: Store) {
  store.currentSong = store.list.songs[0];
  const webStream = music.getAudioSource(store.currentSong.url);
  const nodeStream = Readable.from(webStream);
  const audioResource = createAudioResource(nodeStream, {
    inputType: StreamType.WebmOpus,
  });
  store.player.play(audioResource);
}

function setupPlayerListener(store: Store) {
  store.player.on("stateChange", (oldState, newState) => {
    if (
      oldState.status === AudioPlayerStatus.Playing &&
      newState.status === AudioPlayerStatus.Idle
    ) {
      if (store.list.songs.length > 0) {
        store.list.remove(0);
        if (store.list.songs.length > 0) {
          playNextSong(store);
        } else {
          store.currentSong = null;
        }
      }
    }
  });
}

export default {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("contrala la playlist")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Muestra la lista de reproducción."),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("play").setDescription("Inicia la reproducción."),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("pause").setDescription("Detiene la reproducción."),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("skip").setDescription("Pasa a la siguiente canción."),
    )
    .addSubcommand((subcommand) =>
      subcommand
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remueve una canción")
        .addNumberOption((option) =>
          option
            .setName("id")
            .setDescription("ID de la canción a eliminar.")
            .setRequired(true),
        ),
    )
    .addSubcommandGroup((group) =>
      group
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
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("query")
            .setDescription("Busca una canción mediante YouTube Music.")
            .addStringOption((option) =>
              option
                .setName("query")
                .setDescription("Query de busqueda.")
                .setRequired(true),
            ),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await userAndBotInSameVC(interaction))) {
      await interaction.reply({
        content: "Necesitas estar en el mismo VC que yo",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const store = getStore(interaction);
    const subcommand = interaction.options.getSubcommand();

    if (!store.listenerActive) {
      setupPlayerListener(store);
      store.listenerActive = true;
    }

    switch (subcommand) {
      case "play": {
        if (store.list.songs.length === 0) {
          throw "No hay canciones en la playlist";
        }

        await interaction.deferReply();

        if (store.player.state.status === AudioPlayerStatus.Paused) {
          store.player.unpause();
          await interaction.followUp("Reproduciondo audio.");
        } else if (store.player.state.status === AudioPlayerStatus.Playing) {
          await interaction.followUp("El audio ya se esta reproduciendo.");
        } else {
          playNextSong(store);
          await interaction.followUp("Reproduciondo audio.");
        }
        break;
      }

      case "pause": {
        if (store.list.songs.length === 0) {
          throw "No hay canciones en la playlist";
        }

        if (store.player.state.status === AudioPlayerStatus.Paused) {
          await interaction.reply("El audio ya está pausado.");
        } else {
          store.player.pause();
          await interaction.reply("Audio pausado.");
        }
        break;
      }

      case "skip":
        if (store.list.songs.length <= 1) {
          throw "No hay suficientes canciones en la playlist";
        }

        store.list.remove(0);
        playNextSong(store);
        await interaction.reply("Skipped.");
        break;

      case "list":
        await interaction.reply(store.list.display());
        break;

      case "url": {
        const url = interaction.options.getString("url");
        if (url === null) throw "URL no encotrada en opciones";
        const urls = parseUrlsFromInput(url);
        if (urls.length === 0) throw "URL no valida";
        if (urls.some((value) => !URL.canParse(value))) throw "URL no valida";

        const songs = await Promise.all(
          urls.map((value) => music.songfromUrl(value)),
        );
        const collector = await createConfirmButtonCollector(
          interaction,
          formatBatchConfirmation(songs),
        );

        collector.on("collect", async (i) => {
          await i.deferUpdate();
          await interaction.deleteReply();

          if (i.customId === "confirm") {
            for (const song of songs) {
              store.list.add(song);
            }
            await interaction.followUp(
              songs.length === 1
                ? `Canción añadida: ${songs[0].url}`
                : `Canciones añadidas: ${songs.length}`,
            );
          } else if (i.customId === "cancel") {
            await interaction.followUp("Operación cancelada.");
          }
        });

        collector.on("end", async (collected) => {
          if (collected.size === 0) {
            await interaction.followUp({
              content: "Operación cancelada. Te quedaste sin tiempo",
              flags: MessageFlags.Ephemeral,
            });
          }
        });
        break;
      }

      case "query": {
        const query = interaction.options.getString("query");
        if (query === null) throw "URL no encotrada en opciones";
        const song = await music.search(query);
        const collector = await createConfirmButtonCollector(
          interaction,
          song.url,
        );

        collector.on("collect", async (i) => {
          await i.deferUpdate();
          await interaction.deleteReply();

          if (i.customId === "confirm") {
            store.list.add(song);
            await interaction.followUp(`Canción añadida: ${song.url}`);
          } else if (i.customId === "cancel") {
            await interaction.followUp("Operación cancelada.");
          }
        });

        collector.on("end", async (collected) => {
          if (collected.size === 0) {
            await interaction.followUp({
              content: "Operación cancelada. Te quedaste sin tiempo",
              flags: MessageFlags.Ephemeral,
            });
          }
        });
        break;
      }

      case "remove": {
        const id = interaction.options.getNumber("id");
        if (id === null) throw "ID no encotrada en opciones";
        if (
          id === 0 &&
          store.player.state.status === AudioPlayerStatus.Playing
        ) {
          await interaction.reply(
            "No puedes borrar la canción en reproducción",
          );
          return;
        }

        if (store.list.songs.length > 0) {
          store.list.remove(id);
          await interaction.reply(store.list.display());
        }
        break;
      }

      case "move": {
        const from = interaction.options.getNumber("from");
        const to = interaction.options.getNumber("to");
        if (from === null || to === null) throw "ID no encotrada en opciones";
        if (
          (from === 0 || to === 0) &&
          store.player.state.status === AudioPlayerStatus.Playing
        ) {
          await interaction.reply(
            "No puedes borrar la canción en reproducción",
          );
          return;
        }

        if (store.list.songs.length > 0) {
          store.list.move(from, to);
          await interaction.reply(store.list.display());
        }
        break;
      }

      default:
        await interaction.reply({
          content: "Aún no se ha implementado.",
          flags: MessageFlags.Ephemeral,
        });
        break;
    }
  },
};
