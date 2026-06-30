import { Innertube, Log, UniversalCache, YTNodes } from "youtubei.js";
import { getSpotifyData, getSpotifyPlaylist } from "./spotify.ts";
import { preattyTime } from "../utils/time.ts";

Log.setLevel(0);
const yt = await Innertube.create({
  cache: new UniversalCache(false),
  retrieve_player: false,
  generate_session_locally: true,
});

export interface Song {
  title: string;
  url: string;
  duration: string;
}

export class Playlist {
  songs: Song[] = [];

  public add(s: Song) {
    this.songs.push(s);
  }

  public remove(index: number) {
    if (this.songs[index] === undefined) {
      throw "Index de la canción es invalido";
    }
    this.songs.splice(index, 1);
  }

  public removeFromSong(s: Song) {
    for (let i = 0; i < this.songs.length; i++) {
      const song = this.songs[i];
      if (s == song) {
        this.remove(i);
        return;
      }
    }
  }

  public move(from: number, to: number) {
    if (this.songs.length < 2) {
      throw "No hay suficientes canciones en la playlist";
    }
    if (
      this.songs[from] === undefined ||
      this.songs[to] === undefined ||
      to == from
    ) {
      throw "Index de la canción es invalido";
    }

    const [element] = this.songs.splice(from, 1);
    this.songs.splice(to, 0, element);
  }

  public display(): string {
    return (
      this.songs.map((x, i) => `${i}) ${x.title} - ${x.duration}`).join("\n") ||
      "No hay canciones en la lista de reproducción."
    );
  }
}

function parseUrlsFromInput(value: string): string[] {
  return value
    .split(/\s+/)
    .map((url) => url.trim())
    .filter(Boolean);
}

export function getAudioSource(url: string): ReadableStream<Uint8Array> {
  const command = new Deno.Command("yt-dlp", {
    args: [
      "--no-playlist",
      "-f",
      "bestaudio[ext=webm]/bestaudio",
      "-o",
      "-",
      "--quiet",
      url,
    ],
    stdout: "piped",
    stderr: "inherit",
  });

  const process = command.spawn();
  const stream = process.stdout.pipeThrough(
    new TransformStream({
      flush() {
        process.status.catch(() => {});
      },
    }),
  );
  return stream;
}

async function songsFromYoutubeUrl(url: string): Promise<Song> {
  const info = await yt.getInfo(await yt.resolveURL(url));

  if (
    !info.basic_info.title ||
    !info.basic_info.id ||
    !info.basic_info.duration
  ) {
    throw "No se pudo encontrar canción";
  }

  return {
    title: info.basic_info.title,
    url: `https://www.youtube.com/watch?v=${info.basic_info.id}`,
    duration: preattyTime(info.basic_info.duration),
  };
}

export async function search(query: string): Promise<Song> {
  const res = await yt.music.search(query, { type: "song" });
  const firstSong = res.songs?.contents?.[0];
  if (!firstSong || !firstSong.title || !firstSong.id || !firstSong.duration) {
    throw "No se pudo encontrar canción";
  }

  return {
    title: firstSong.title,
    url: `https://www.youtube.com/watch?v=${firstSong.id}`,
    duration: firstSong.duration.text,
  };
}

export async function songsfromUrl(url: string): Promise<Song[]> {
  const urls = parseUrlsFromInput(url);
  if (urls.length === 0 || urls.some((value) => !URL.canParse(value))) {
    throw "URL no valida";
  }

  const songs: Song[] = [];
  for (const url of urls) {
    if (url.includes("spotify")) {
      if (url.includes("/album/") || url.includes("/playlist/")) {
        const songData = await getSpotifyPlaylist(url);
        const ytSongs = await Promise.all(
          songData.map((song) => search(`${song.title} ${song.author}`)),
        );
        songs.push(...ytSongs);
      } else if (url.includes("/track/")) {
        const songData = await getSpotifyData(url);
        songs.push(await search(`${songData.title} ${songData.author}`));
      } else {
        throw `URL "${url}" invalida`;
      }
    } else if (url.includes("youtube")) {
      if (url.includes("/playlist?")) {
        const id = new URL(url).searchParams.get("list");
        if (!id) throw "ID no encontrada";
        const playlist = await yt.music.getPlaylist(id);
        for (const item of playlist.items) {
          if (item instanceof YTNodes.MusicResponsiveListItem) {
            if (!item.title || !item.id || !item.duration) {
              throw `Video ${url} no encontrado.`;
            }
            songs.push({
              title: item.title,
              url: `https://www.youtube.com/watch?v=${item.id}`,
              duration: item.duration.text,
            });
          }
        }
      } else {
        songs.push(await songsFromYoutubeUrl(url));
      }
    } else {
      throw "No implementado";
    }
  }

  return songs;
}
