import assert from "node:assert";
import { test } from "node:test";
import { songsfromUrl } from "../src/playlist/playlist.js";
import { getSpotifyData } from "../src/playlist/spotify.js";

test("url", async () => {
  const data = await getSpotifyData(
    "https://open.spotify.com/intl-es/track/5RJPyaKUYv1t45BSdgSKqu",
  );

  assert.deepStrictEqual(data, {
    title: "I Don't Want to Be an Engineer",
    author: "Ellie Minibot",
  });
});

test("url to youtube", async () => {
  const data = await songsfromUrl(
    "https://open.spotify.com/intl-es/track/5RJPyaKUYv1t45BSdgSKqu",
  );

  assert.deepStrictEqual(data, [
    {
      title: "I Don't Want to Be an Engineer",
      url: "https://www.youtube.com/watch?v=3h7vqzFyKyo",
      duration: "4:29",
    },
  ]);
});

test("playlist url", async () => {
  const data = await songsfromUrl(
    "https://open.spotify.com/intl-es/album/49pb86COfdPTLKxLR0LWyX",
  );

  assert.deepStrictEqual(data, [
    {
      title: "Colorful Array",
      url: "https://www.youtube.com/watch?v=jeVbKwPtL_0",
      duration: "4:33",
    },
  ]);
});
