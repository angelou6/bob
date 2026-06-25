import { Innertube, Log, UniversalCache } from "youtubei.js";
import { getSpotifyData } from "./spotify.ts";
import { preattyTime } from "../utils/time.ts";

Log.setLevel(0);
const yt = await Innertube.create({ cache: new UniversalCache(true) });

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
    if (this.songs[index] === undefined)
      throw "Index de la canción es invalido";
    this.songs.splice(index, 1);
  }

  public move(from: number, to: number) {
    if (this.songs.length < 2)
      throw "No hay suficientes canciones en la playlist";
    if (
      this.songs[from] === undefined ||
      this.songs[to] === undefined ||
      to == from
    )
      throw "Index de la canción es invalido";

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
  });

  const process = command.spawn();
  return process.stdout;
}

async function songFromYoutubeUrl(url: string): Promise<Song> {
  const info = await yt.getInfo(await yt.resolveURL(url));

  if (
    !info.basic_info.title ||
    !info.basic_info.id ||
    !info.basic_info.duration
  )
    throw "No se pudo encontrar canción";

  return {
    title: info.basic_info.title,
    url: `https://www.youtube.com/watch?v=${info.basic_info.id}`,
    duration: preattyTime(info.basic_info.duration),
  };
}

export async function search(query: string): Promise<Song> {
  const res = await yt.music.search(query, { type: "song" });
  const firstSong = res.songs?.contents?.[0];
  if (!firstSong || !firstSong.title || !firstSong.id || !firstSong.duration)
    throw "No se pudo encontrar canción";

  return {
    title: firstSong.title,
    url: `https://www.youtube.com/watch?v=${firstSong.id}`,
    duration: firstSong.duration.text,
  };
}

export async function songfromUrl(url: string): Promise<Song> {
  if (url.includes("spotify")) {
    const songData = await getSpotifyData(url);
    return search(`${songData.title} ${songData.author}`);
  } else if (url.includes("youtube")) {
    return songFromYoutubeUrl(url);
  }
  throw "No implementado";
}
