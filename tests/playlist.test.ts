import { getSpotifyData } from "../src/playlist/spotify.ts";
import { search, songfromUrl } from "../src/playlist/playlist.ts";
import { assertEquals } from "@std/assert";

Deno.test("spotify url", async () => {
  const data = await getSpotifyData(
    "https://open.spotify.com/intl-es/track/5RJPyaKUYv1t45BSdgSKqu",
  );
  assertEquals(data, {
    title: "I Don't Want to Be an Engineer",
    author: "Ellie Minibot",
  });
});

Deno.test("spotify url to youtube", async () => {
  const data = await songfromUrl(
    "https://open.spotify.com/intl-es/track/5RJPyaKUYv1t45BSdgSKqu",
  );
  assertEquals(data, {
    title: "I Don't Want to Be an Engineer",
    url: "https://www.youtube.com/watch?v=3h7vqzFyKyo",
    duration: "4:29",
  });
});

Deno.test("youtube url", async () => {
  const data = await songfromUrl("https://www.youtube.com/watch?v=3h7vqzFyKyo");
  assertEquals(data, {
    title: "I Don't Want to Be an Engineer",
    url: "https://www.youtube.com/watch?v=3h7vqzFyKyo",
    duration: "4:29",
  });
});

Deno.test("youtube test", async () => {
  const data = await search("Coffee (Radio Edit) Supersister");
  assertEquals(data, {
    title: "Coffee (Radio Edit)",
    url: "https://www.youtube.com/watch?v=JjY9_RyIeQw",
    duration: "3:32",
  });
});
