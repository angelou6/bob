import re

from ytmusicapi import YTMusic

from bob.errors import URLError
from bob.playlist.song import Song

YT_REGEX = re.compile(
    r"^(https?://)?(www\.|music\.)?(youtube\.com/(watch\?v=[\w-]{11}|shorts/[\w-]{11}|playlist\?list=[\w-]+)|youtu\.be/[\w-]{11})"
)

YT_ID_REGEX = re.compile(
    r'(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})'
)

ytmusic = YTMusic()


def format_duration(duration: int) -> str:
    minutes, seconds = divmod(duration, 60)
    return f"{minutes}:{seconds:02d}"


def verify_url(url: str) -> bool:
    return YT_REGEX.match(url) is not None


def is_playlist(url: str) -> bool:
    return "/playlist?" in url


def get_video_id(url: str) -> str | None:
    id = re.search(YT_ID_REGEX, url)
    return id.group(1) if id is not None else None


def get_playlist_url(url: str) -> str | None:
    id = re.search("[&?]list=([^&]+)", url)
    return id.group(1) if id is not None else None


def get_playlist(url: str) -> list[Song]:
    songs = []
    id = get_playlist_url(url)
    if id is None:
        raise URLError("Could not get playlist")

    playlist = ytmusic.get_playlist(id)
    for track in playlist["tracks"]:
        url = f"https://www.youtube.com/watch?v={track['videoId']}"
        songs.append(Song(track["title"], url, track["duration"]))
    return songs


def get_data(url: str) -> Song:
    id = get_video_id(url)
    if id is None:
        raise URLError("Could not get video")

    song = ytmusic.get_song(id)
    if not song:
        raise URLError("Could not get video")

    song = song["videoDetails"]
    url = f"https://www.youtube.com/watch?v={song['videoId']}"
    return Song(song["title"], url, format_duration(int(song["lengthSeconds"])))


def search(query: str) -> Song:
    song = ytmusic.search(query, filter="songs", limit=1)

    if not song:
        raise URLError(f"No song found. Search query: {query}")

    song = song[0]
    url = f"https://www.youtube.com/watch?v={song['videoId']}"
    return Song(song["title"], url, song["duration"])
