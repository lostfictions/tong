import axios from "axios";
import cheerio from "cheerio";

import { randomInArray } from "../util";

/**
 * Perform an image search, optionally filter recently-seen images, and select a
 * random image from the top N remaining results.
 */
export async function imageSearch({
  term,
  selectFromTop = 5,
  recents,
  animated = false
}: {
  term: string;
  selectFromTop?: number;
  recents?: { [url: string]: unknown };
  animated?: boolean;
}): Promise<string | false> {
  let res = await requestAndParse({ term, animated, exact: true });
  if (res.length === 0) {
    // if no results, try an inexact search
    res = await requestAndParse({ term, animated });
  }

  res = res.slice(0, selectFromTop);

  if (recents) {
    for (let i = res.length - 1; i >= 0; i--) {
      if (!(res[i] in recents)) {
        res.splice(i, 1);
      }
    }
  }

  if (res.length === 0) {
    return false;
  }

  let result = randomInArray(res);

  // rewrite .gifv => .gif
  if (result.endsWith(".gifv")) {
    const gifvUrlAsGif = result.substring(0, result.length - 1);
    const gifRes = await axios.head(gifvUrlAsGif);
    if (gifRes.status >= 200 && gifRes.status < 400) {
      result = gifvUrlAsGif;
    }
  }

  return result;
}

export interface ImageSearchOptions {
  term: string;
  animated?: boolean;
  exact?: boolean;
  transparent?: boolean;
}

export async function requestAndParse(options: ImageSearchOptions) {
  const res = await request(options);
  return parse(res.data);
}

export function request({
  term,
  animated,
  exact,
  transparent
}: ImageSearchOptions) {
  const tbs = [transparent && "ic:trans", animated && "itp:animated"]
    .filter(Boolean)
    .join(",");

  return axios.get<string>("https://www.google.com/search", {
    params: {
      q: term,
      tbm: "isch",
      nfpr: exact ? 1 : 0,
      tbs: tbs || undefined
    },
    timeout: 5000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36"
    }
  });
}

export function parse(html: string) {
  const $ = cheerio.load(html);

  const strategies = [metaJsonStrategy, largestJsonpStrategy];

  for (const s of strategies) {
    const res = s($);
    if (res) return res;
  }

  return [];
}

export function metaJsonStrategy($: CheerioStatic): string[] | false {
  const metaLinks = $(".rg_meta");

  if (metaLinks.length === 0) return false;

  const urls: string[] = [];
  metaLinks.each((_i, el) => {
    if (el.children.length > 0 && "data" in el.children[0]) {
      const metadata = JSON.parse((el.children[0] as any).data);
      // x-raw-image = when google sometimes embeds the preview!
      if (metadata.ou && !metadata.ou.startsWith("x-raw-image")) {
        urls.push(metadata.ou);
      }
      // Elements without metadata.ou are subcategory headings in the results page.
    }
  });

  return urls;
}

export function largestJsonpStrategy($: CheerioStatic): string[] | false {
  const scripts = $("script").toArray();

  let script: string | null = null;
  let longest = Number.NEGATIVE_INFINITY;

  for (const el of scripts) {
    const s = $(el).text();
    if (/^\w*AF_initDataCallback/.test(s)) {
      if (s.length > longest) {
        script = s;
        longest = s.length;
      }
    }
  }

  if (script) {
    const PREFIX = "data:function(){return ";
    const SUFFIX = "}});";
    const i = script.indexOf(PREFIX);

    if (i !== -1) {
      const data = script.substring(
        i + PREFIX.length,
        script.length - SUFFIX.length
      );

      return [
        ...data.matchAll(/"https?:\/\/[^"]+\.(?:jpe?g|gifv|png)"/g)
      ].map(res => res[0].substring(1, res[0].length - 1));
    }
  }

  return false;
}