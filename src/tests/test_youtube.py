import unittest

from bob.playlist import platform, youtube


class TestYouTube(unittest.TestCase):
    def test_url(self):
        data = platform.find_songs("https://www.youtube.com/watch?v=3h7vqzFyKyo")
        self.assertEqual(data[0].title, "I Don't Want to Be an Engineer")
        self.assertEqual(data[0].url, "https://www.youtube.com/watch?v=3h7vqzFyKyo")
        self.assertEqual(data[0].duration, "4:29")

    def test_search(self):
        data = youtube.search("Coffee (Radio Edit) Supersister")
        self.assertEqual(data.title, "Coffee (Radio Edit)")
        self.assertEqual(data.url, "https://www.youtube.com/watch?v=JjY9_RyIeQw")
        self.assertEqual(data.duration, "3:32")

    def test_playlist(self):
        data = platform.find_songs(
            "https://music.youtube.com/playlist?list=OLAK5uy_mW0lhv4m1_T0MxfIY5w_DHznHkpawAboY"
        )
        self.assertEqual(data[0].title, "Colorful Array")
        self.assertEqual(data[0].url, "https://www.youtube.com/watch?v=jeVbKwPtL_0")
        self.assertEqual(data[0].duration, "4:33")

    def test_short_url(self):
        data = platform.find_songs("https://youtu.be/3h7vqzFyKyo?si=_8tNdXzNTabSMuqs")
        self.assertEqual(data[0].title, "I Don't Want to Be an Engineer")
        self.assertEqual(data[0].url, "https://www.youtube.com/watch?v=3h7vqzFyKyo")
        self.assertEqual(data[0].duration, "4:29")


if __name__ == "__main__":
    unittest.main()
