import re
from typing import cast
from urllib.request import urlopen

from attr import dataclass
from lxml import html
from lxml.etree import _Element
from lxml.html import HtmlElement

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


def text_from_css(element: _Element, selector: str) -> str | None:
    spans = cast(
        list[HtmlElement],
        element.cssselect(selector),
    )
    return spans[0].text_content().strip() if spans else None


def is_playlist(url: str) -> bool:
    return "/album/" in url or "/playlist/" in url


def verify_url(url: str) -> bool:
    return SPOTIFY_REGEX.match(url) is not None


def get_data(url: str) -> SpotifyData:
    with urlopen(url) as res:
        data = res.read().decode("utf-8")
        tree = html.fromstring(data)
        title = tree.xpath(
            '//*[@id="main"]/div/div/div[2]/div/div[1]/div/div[1]/h1/text()'
        )
        author = tree.xpath(
            '//*[@id="main"]/div/div/div[2]/div/div[1]/div/div[1]/div[2]/a/text()'
        )

        if isinstance(title, list) and isinstance(author, list):
            title = title[0]
            author = author[0]

            return SpotifyData(title, author)  # type: ignore

    raise ValueError(f"Could not get data from url: {url}")


def get_playlist(url: str) -> list[SpotifyData]:
    results: list[SpotifyData] = []
    with urlopen(url) as res:
        data = res.read().decode("utf-8")
        tree = html.fromstring(data)
        songs = tree.cssselect("div[data-encore-id='listRow']")
        for song in songs:
            title = text_from_css(song, "p[data-encore-id='listRowTitle'] > span")
            author = text_from_css(song, "p[data-encore-id='listRowDetails'] > span")
            if author and title:
                results.append(SpotifyData(title, author))

    return results
