import unittest

from bob.playlist import platform, spotify


class TestSpotify(unittest.TestCase):
    def test_url(self):
        data = spotify.get_data(
            "https://open.spotify.com/intl-es/track/5RJPyaKUYv1t45BSdgSKqu"
        )
        self.assertEqual(
            data, spotify.SpotifyData("I Don't Want to Be an Engineer", "Ellie Minibot")
        )

    def test_spotify_to_youtube(self):
        data = platform.find_songs(
            "https://open.spotify.com/intl-es/track/5RJPyaKUYv1t45BSdgSKqu"
        )
        self.assertEqual(data[0].title, "I Don't Want to Be an Engineer")
        self.assertEqual(data[0].url, "https://www.youtube.com/watch?v=3h7vqzFyKyo")
        self.assertEqual(data[0].duration, "4:29")

    def test_playlist_url(self):
        data = platform.find_songs(
            "https://open.spotify.com/intl-es/album/0M8Foi8rawsI1YHru9bG9B"
        )
        self.assertEqual(data[0].title, "Stupid Heart")
        self.assertEqual(data[0].url, "https://www.youtube.com/watch?v=AwLg3sQOqys")
        self.assertEqual(data[0].duration, "3:10")
