from bob.errors import URLError
from bob.playlist import spotify, youtube
from bob.playlist.song import Origin, Song, URLData


def get_url_info(url: str) -> URLData:
    if youtube.verify_url(url):
        return URLData(Origin.YOUTUBE, url, youtube.is_playlist(url))
    elif spotify.verify_url(url):
        return URLData(Origin.SPOTIFY, url, spotify.is_playlist(url))
    raise URLError(f"Invalid url: {url}")


def find_songs(url: str) -> list[Song]:
    info = get_url_info(url)

    match info.origin:
        case Origin.SPOTIFY:
            if info.is_playlist:
                songs = spotify.get_playlist(url)
                ytsongs = [
                    youtube.search(f"{song.title} {song.author}") for song in songs
                ]
                return ytsongs
            song = spotify.get_data(url)
            return [youtube.search(f"{song.title} {song.author}")]
        case Origin.YOUTUBE:
            if info.is_playlist:
                return youtube.get_playlist(url)
            return [youtube.get_data(url)]


def format_songs(songs: list[Song]):
    return "".join(
        f"{idx + 1}. {song.title} \n{song.url}\n" for (idx, song) in enumerate(songs)
    )
