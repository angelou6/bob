import unittest

from bob.playlist import platform, youtube


class TestYouTube(unittest.TestCase):
    def test_url(self):
        data = platform.find_songs("https://www.youtube.com/watch?v=3h7vqzFyKyo")

        self.assertEqual(
            data,
            [
                platform.Song(
                    "I Don't Want to Be an Engineer",
                    "https://www.youtube.com/watch?v=3h7vqzFyKyo",
                    "4:29",
                )
            ],
        )

    def test_search(self):
        data = youtube.search("Coffee (Radio Edit) Supersister")

        self.assertEqual(
            data,
            platform.Song(
                "Coffee (Radio Edit)",
                "https://www.youtube.com/watch?v=JjY9_RyIeQw",
                "3:32",
            ),
        )

    def test_playlist(self):
        data = platform.find_songs(
            "https://music.youtube.com/playlist?list=OLAK5uy_mW0lhv4m1_T0MxfIY5w_DHznHkpawAboY"
        )

        self.assertEqual(
            data,
            [
                platform.Song(
                    "Colorful Array",
                    "https://www.youtube.com/watch?v=jeVbKwPtL_0",
                    "4:33",
                )
            ],
        )

    def test_short_url(self):
        data = platform.find_songs("https://youtu.be/3h7vqzFyKyo?si=_8tNdXzNTabSMuqs")

        self.assertEqual(
            data,
            [
                platform.Song(
                    "I Don't Want to Be an Engineer",
                    "https://www.youtube.com/watch?v=3h7vqzFyKyo",
                    "4:29",
                )
            ],
        )


if __name__ == "__main__":
    unittest.main()
