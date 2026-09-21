from enum import Enum

from attr import dataclass


class Origin(Enum):
    YOUTUBE = 0
    SPOTIFY = 1


class URLData:
    origin: Origin
    url: str
    is_playlist: bool

    def __init__(self, origin: Origin, url: str, is_playlist: bool) -> None:
        self.origin = origin
        self.url = url
        self.is_playlist = is_playlist


@dataclass
class Song:
    title: str
    url: str
    duration: str

    def __init__(self, title: str, url: str, duration: str) -> None:
        self.title = title
        self.url = url
        self.duration = duration
