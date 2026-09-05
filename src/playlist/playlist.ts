import { spawn } from "node:child_process";
import { Innertube, Log, UniversalCache } from "youtubei.js";
import { urlToSongs } from "./urls.js";

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

function swap(arr: Song[], i: number, j: number): void {
	const a = arr[i];
	const b = arr[j];
	if (a === undefined || b === undefined) return;
	arr[i] = b;
	arr[j] = a;
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
			if (s === song) {
				this.remove(i);
				return;
			}
		}
	}

	public shuffle(skip_first: boolean = false) {
		for (let i = this.songs.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			if (skip_first) j += 1;
			swap(this.songs, i, j);
		}
	}

	public move(from: number, to: number) {
		if (this.songs.length < 2) {
			throw "No hay suficientes canciones en la playlist";
		}
		if (
			this.songs[from] === undefined ||
			this.songs[to] === undefined ||
			to === from
		) {
			throw "Index de la canción es invalido";
		}

		const [element] = this.songs.splice(from, 1);
		if (element === undefined) throw "elemento no existe";
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

export function getAudioSource(url: string) {
	const child = spawn(
		"yt-dlp",
		[
			"--no-playlist",
			"-f",
			"bestaudio[ext=webm]/bestaudio",
			"-o",
			"-",
			"--quiet",
			url,
		],
		{
			stdio: ["ignore", "pipe", "inherit"],
		},
	);

	return child.stdout;
}

export async function search(query: string): Promise<Song> {
	const res = await yt.music.search(query, { type: "song" });
	const firstSong = res.songs?.contents?.[0];
	if (!firstSong?.title || !firstSong?.id || !firstSong?.duration) {
		console.error(`Error encontrando canción: ${query}`);
		console.error(firstSong);
		throw "No se pudo encontrar canción.";
	}

	return {
		title: firstSong.title,
		url: `https://www.youtube.com/watch?v=${firstSong.id}`,
		duration: firstSong.duration.text,
	};
}

export async function songsfromUrl(url: string): Promise<Song[]> {
	const songs: Song[] = [];
	const urls = parseUrlsFromInput(url);

	if (urls.length === 0 || urls.some((value) => !URL.canParse(value))) {
		throw "URL no valida";
	}

	for (const url of urls) {
		songs.push(...(await urlToSongs(url, yt)));
	}

	return songs;
}
