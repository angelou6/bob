import { Innertube, UniversalCache } from "youtubei.js";
import { getSpotifyData } from "./spotify.ts";
import { preattyTime } from "../utils/time.ts";
import { sourceExists } from "../utils/ping.ts";

const yt = await Innertube.create({ cache: new UniversalCache(false) });

export interface song {
  title: string;
  url: string;
  duration: string;
}

export class playlist {
  songs: song[] = [];

  public add(s: song) {
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

    const element = this.songs.slice(from, 1)[0];
    this.songs.splice(to, 0, element);
  }

  public list(): string {
    return this.songs
      .map((x, i) => `${i}) ${x.title} - ${x.duration}`)
      .join("\n");
  }
}

export async function getAudioSource(url: string): Promise<string> {
  let source = "";
  const decoder = new TextDecoder();
  const command = new Deno.Command("yt-dlp", {
    args: ["-f", "ba", "--get-url", url],
  });

  do {
    const { code, stdout } = await command.output();
    if (code > 0) throw "error usando yt-dlp";
    source = decoder.decode(stdout);
  } while (!sourceExists(source));

  return source;
}

async function songFromYoutubeUrl(url: string): Promise<song> {
  const endpoint = await yt.resolveURL(url);
  const info = await yt.getInfo(endpoint);

  if (
    !info.basic_info.title ||
    !info.basic_info.id ||
    !info.basic_info.duration
  )
    throw "No se pudo encontrar canción";

  return {
    title: info.basic_info.title,
    url: url,
    duration: preattyTime(info.basic_info.duration),
  };
}

export async function search(query: string): Promise<song> {
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

export async function songfromUrl(url: string): Promise<song> {
  if (url.includes("spotify")) {
    const songData = await getSpotifyData(url);
    return search(`${songData.title} ${songData.author}`);
  } else if (url.includes("youtube")) {
    return songFromYoutubeUrl(url);
  }
  throw "No implementado";
}
