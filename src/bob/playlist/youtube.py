import re
from typing import Any, cast

from yt_dlp import YoutubeDL

from bob.errors import URLError
from bob.playlist.song import Song

YT_REGEX = re.compile(
    r"^(https?://)?(www\.|music\.)?(youtube\.com/(watch\?v=[\w-]{11}|shorts/[\w-]{11}|playlist\?list=[\w-]+)|youtu\.be/[\w-]{11})"
)

ydl_opts = {
    "format": "bestaudio/best",
    "skip_download": True,
    "quiet": True,
    "no_warnings": True,
    "ignore_errors": True,
}

search_opts = {
    **ydl_opts,
    "playlist_items": "1",
}

ydl = YoutubeDL(cast(Any, ydl_opts))


def __format_duration(duration: int) -> str:
    minutes, seconds = divmod(duration, 60)
    return f"{minutes}:{seconds:02d}"


def verify_url(url: str) -> bool:
    return YT_REGEX.match(url) is not None


def is_playlist(url: str) -> bool:
    return "/playlist?" in url


def get_playlist(url: str) -> list[Song]:
    songs = []
    info = ydl.extract_info(url, download=False)
    # TODO: This is slow as balls, figure out a way to do faster.
    if "entries" in info:
        for video in info["entries"]:
            if video is None:
                continue
            title = video.get("title")
            duration = video.get("duration")
            video_id = video.get("id")
            source_url = video.get("url")
            video_url = (
                f"https://www.youtube.com/watch?v={video_id}" if video_id else None
            )

            if title and video_url and duration and source_url:
                songs.append(
                    Song(title, video_url, source_url, __format_duration(duration))
                )
    return songs


def get_data(url: str) -> Song:
    info = ydl.extract_info(url, download=False)
    title = info.get("title")
    duration = info.get("duration")
    video_id = info.get("id")
    source_url = info.get("url")
    video_url = f"https://www.youtube.com/watch?v={video_id}" if video_id else None

    if title and video_url and duration and source_url:
        return Song(title, video_url, source_url, __format_duration(duration))
    raise URLError("Invalid YouTube URL")


def search(query: str) -> Song:
    search_url = f"https://music.youtube.com/search?q={query}"
    with YoutubeDL(cast(Any, search_opts)) as sydl:
        info = sydl.extract_info(search_url, download=False)

        # It works and I don't want to make the code ugly just to make pyright stop complaining
        # I love pyright
        video = info["entries"][0]  # type: ignore
        title = video.get("title")
        source_url = video.get("url")
        video_url = video.get("webpage_url")
        duration = video.get("duration")

        if title and video_url and duration and source_url:
            return Song(title, video_url, source_url, __format_duration(duration))
    raise URLError(f"Error during search. Search query: {query}")
