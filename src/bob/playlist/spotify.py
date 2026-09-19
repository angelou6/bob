import re
from urllib.request import urlopen

from attr import dataclass
from selectolax.lexbor import LexborHTMLParser

SPOTIFY_REGEX = re.compile(
    r"https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?(track|album|playlist)\/([A-Za-z0-9]{22})(?:\?\S*)?"
)


@dataclass
class SpotifyData:
    title: str
    author: str

    def __init__(self, title: str, author: str) -> None:
        self.title = title
        self.author = author


def is_playlist(url: str) -> bool:
    return "/album/" in url or "/playlist/" in url


def verify_url(url: str) -> bool:
    return SPOTIFY_REGEX.match(url) is not None


def get_data(url: str) -> SpotifyData:
    with urlopen(url) as res:
        data = res.read().decode("utf-8")
        parser = LexborHTMLParser(data)
        title = parser.css_first("h1.mbNIy3B9g1lTNZxilD3l").text()
        author = parser.css_first(".MhXYXgEVFIkj5DMBBtNa a").text()
    return SpotifyData(title, author)


def get_playlist(url: str) -> list[SpotifyData]:
    results: list[SpotifyData] = []
    with urlopen(url) as res:
        data = res.read().decode("utf-8")
        parser = LexborHTMLParser(data)
        songs = parser.css("div[data-encore-id='listRow']")
        for song in songs:
            title = song.css_first("p[data-encore-id='listRowTitle'] > span").text()
            author = song.css_first("p[data-encore-id='listRowDetails'] > span").text()
            results.append(SpotifyData(title, author))
    return results
