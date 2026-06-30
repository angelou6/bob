import { search, songsfromUrl } from "../src/playlist/playlist.ts";
import { assertEquals } from "@std/assert";

Deno.test("youtube url", async () => {
  const data = await songsfromUrl(
    "https://www.youtube.com/watch?v=3h7vqzFyKyo",
  );
  assertEquals(data, [
    {
      title: "I Don't Want to Be an Engineer",
      url: "https://www.youtube.com/watch?v=3h7vqzFyKyo",
      duration: "4:29",
    },
  ]);
});

Deno.test("youtube search", async () => {
  const data = await search("Coffee (Radio Edit) Supersister");
  assertEquals(data, {
    title: "Coffee (Radio Edit)",
    url: "https://www.youtube.com/watch?v=JjY9_RyIeQw",
    duration: "3:32",
  });
});

Deno.test("youtube playlist", async () => {
  const data = await songsfromUrl(
    "https://music.youtube.com/playlist?list=OLAK5uy_mW0lhv4m1_T0MxfIY5w_DHznHkpawAboY",
  );
  assertEquals(data, [
    {
      title: "Colorful Array",
      url: "https://www.youtube.com/watch?v=jeVbKwPtL_0",
      duration: "4:33",
    },
  ]);
});
