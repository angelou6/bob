import random

from bob.playlist.song import Song


class Playlist:
    current_song: Song | None
    songs: list[Song]

    def __init__(self, current=None) -> None:
        self.current_song = current
        self.songs = []

    def add(self, s: Song):
        self.songs.append(s)

    def remove(self, idx: int):
        del self.songs[idx]

    def shuffle(self, skip_first=True):
        if skip_first:
            subset = self.songs[1:]
            random.shuffle(subset)
            self.songs[1:] = subset
        random.shuffle(self.songs)

    def move(self, origin: int, to: int):
        self.songs[origin], self.songs[to] = self.songs[to], self.songs[origin]

    def display(self) -> str:
        if len(self.songs) > 0:
            return "".join(
                f"{i} - {song.title} {song.duration}\n"
                for i, song in enumerate(self.songs)
            )
        return "No hay canciones en la lista de reproducción."
