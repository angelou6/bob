import * as cheerio from "cheerio";

interface spotifyData {
  title: string;
  author: string;
}

export async function getSpotifyData(url: string): Promise<spotifyData> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  return {
    title: $("h1.KL2Hl01OoEqXbgKK").text(),
    author: $(".R2qcMPMSVf4gnglJ a").text(),
  };
}
