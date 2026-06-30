import { assertEquals } from "@std/assert/equals";
import { getSpotifyData } from "../src/playlist/spotify.ts";
import { songsfromUrl } from "../src/playlist/playlist.ts";

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
  const data = await songsfromUrl(
    "https://open.spotify.com/intl-es/track/5RJPyaKUYv1t45BSdgSKqu",
  );
  assertEquals(data, [
    {
      title: "I Don't Want to Be an Engineer",
      url: "https://www.youtube.com/watch?v=3h7vqzFyKyo",
      duration: "4:29",
    },
  ]);
});

Deno.test("spotify playlist url", async () => {
  const data = await songsfromUrl(
    "https://open.spotify.com/intl-es/album/49pb86COfdPTLKxLR0LWyX",
  );
  assertEquals(data, [
    {
      title: "Colorful Array",
      url: "https://www.youtube.com/watch?v=jeVbKwPtL_0",
      duration: "4:33",
    },
  ]);
});
