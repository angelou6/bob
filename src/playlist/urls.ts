import { YTNodes } from "youtubei.js";
import type Innertube from "youtubei.js/cf-worker";
import { preattyTime } from "../utils/time.js";
import { type Song, search } from "./playlist.js";
import { getSpotifyData, getSpotifyPlaylist } from "./spotify.js";

type Origin = "Youtube" | "Spotify";

interface UrlData {
	origin: Origin;
	url: string;
	isPlaylist: boolean;
}

function isYoutubeUrl(url: string): boolean {
	const pattern =
		/^(https?:\/\/)?(www\.|music\.)?(youtube\.com\/(watch\?v=[\w-]{11}|shorts\/[\w-]{11}|playlist\?list=[\w-]+)|youtu\.be\/[\w-]{11})/;
	return !!url.match(pattern)?.[1];
}

function getUrlInfo(url: string): UrlData {
	if (isYoutubeUrl(url)) {
		return {
			origin: "Youtube",
			url: url,
			isPlaylist: url.includes("/playlist?"),
		};
	} else if (url.includes("spotify")) {
		const isPlaylist = url.includes("/album/") || url.includes("/playlist/");
		if (!isPlaylist && !url.includes("/track/")) throw `URL "${url}" invalida`;
		return {
			origin: "Spotify",
			url: url,
			isPlaylist: isPlaylist,
		};
	} else throw `Url: ${url} invalida o no implementada.`;
}

function extractVideoId(url: string) {
	const patterns = [
		/youtu\.be\/([\w-]{11})/,
		/youtube\.com\/watch\?v=([\w-]{11})/,
		/[?&]v=([\w-]{11})/,
		/youtube\.com\/shorts\/([\w-]{11})/,
		/youtube\.com\/live\/([\w-]{11})/,
		/youtube\.com\/embed\/([\w-]{11})/,
	];
	for (const p of patterns) {
		const m = url.match(p);
		if (m) return m[1];
	}
	throw `No se pudo encontrar el videoId de ${url}`;
}

export async function urlToSongs(url: string, yt: Innertube): Promise<Song[]> {
	const info = getUrlInfo(url);

	switch (info.origin) {
		case "Spotify":
			if (info.isPlaylist) {
				const songData = await getSpotifyPlaylist(url);
				const ytSongs = await Promise.all(
					songData.map((song) => search(`${song.title} ${song.author}`)),
				);
				return ytSongs;
			} else {
				const songData = await getSpotifyData(url);
				return [await search(`${songData.title} ${songData.author}`)];
			}
		case "Youtube":
			if (info.isPlaylist) {
				const id = new URL(url).searchParams.get("list");
				if (!id) throw "id del video no encontrada";
				const playlist = await yt.music.getPlaylist(id);
				const songs: Song[] = [];

				for (const item of playlist.items) {
					if (!(item instanceof YTNodes.MusicResponsiveListItem)) continue;
					if (!item.title || !item.id || !item.duration) {
						throw `Video ${url} no encontrado.`;
					}

					songs.push({
						title: item.title,
						url: `https://www.youtube.com/watch?v=${item.id}`,
						duration: item.duration.text,
					});
				}
				return songs;
			} else {
				const id = extractVideoId(url);
				if (!id) throw "id del video no encontrada";
				const videoInfo = await yt.getBasicInfo(id);
				if (
					!videoInfo.basic_info.title ||
					!videoInfo.basic_info.id ||
					!videoInfo.basic_info.duration
				) {
					throw "No se pudo encontrar canción";
				}

				return [
					{
						title: videoInfo.basic_info.title,
						url: `https://www.youtube.com/watch?v=${videoInfo.basic_info.id}`,
						duration: preattyTime(videoInfo.basic_info.duration),
					},
				];
			}
	}
}
