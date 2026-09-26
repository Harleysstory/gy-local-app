#!/usr/bin/env node
/**
 * Import local news from the Google News RSS feed for Great Yarmouth.
 *
 * Usage:
 *   node scripts/import-news.mjs              # fetches the live feed
 *   node scripts/import-news.mjs <file.xml>   # or reads a downloaded copy
 *
 * Output: src/data/news.json
 *
 * Note: Google News feeds are licensed for personal, non-commercial
 * feed-reader use — which is exactly what this app is. Keep it that way.
 */

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const FEED_URL =
  "https://news.google.com/rss/search?q=great_yarmouth&hl=en-GB&gl=GB&ceid=GB:en";
const MAX_ITEMS = 100;

async function loadXml() {
  const arg = process.argv[2];
  if (arg && fs.existsSync(arg)) {
    console.log(`Reading local file: ${arg}`);
    return fs.readFileSync(arg, "utf8");
  }
  console.log(`Fetching live feed: ${FEED_URL}`);
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": "gy-local-personal/0.1 (personal feed reader)" },
  });
  if (!res.ok) throw new Error(`Feed returned ${res.status}`);
  return res.text();
}

async function main() {
  const xml = await loadXml();
  // xmlMode matters: <source> is a void element in HTML mode
  const $ = cheerio.load(xml, { xmlMode: true });

  const items = [];
  $("item").each((_, el) => {
    const item = $(el);
    const fullTitle = item.find("title").text().trim();
    const source = item.find("source").text().trim();
    const sourceUrl = item.find("source").attr("url") ?? null;

    // Strip " - edp24.co.uk" suffix now that we have the source separately:
    let title = fullTitle;
    if (source && fullTitle.toLowerCase().endsWith(` - ${source.toLowerCase()}`)) {
      title = fullTitle.slice(0, fullTitle.length - source.length - 3).trim();
    }

    const link = item.find("link").text().trim();
    const guid = item.find("guid").text().trim();
    const pubDate = item.find("pubDate").text().trim();
    const published = pubDate ? new Date(pubDate).toISOString() : null;

    if (!title || (!link && !guid)) return;
    items.push({
      id: guid || link,
      title,
      url: link,
      source,
      source_url: sourceUrl,
      published,
    });
  });

  items.sort((a, b) => (b.published ?? "").localeCompare(a.published ?? ""));
  const capped = items.slice(0, MAX_ITEMS);

  const dest = path.resolve("src/data/news.json");
  fs.writeFileSync(
    dest,
    JSON.stringify({ fetchedAt: new Date().toISOString(), items: capped }, null, 2)
  );
  const sources = [...new Set(capped.map((i) => i.source).filter(Boolean))];
  console.log(`\nImported ${capped.length} articles from ${sources.length} local outlets:`);
  console.log(`  ${sources.join(", ")}`);
  console.log(`Wrote ${dest}`);
}

main().catch((e) => {
  // During builds (Vercel prebuild), a failed fetch must never break the
  // deploy — fall back to the existing committed news.json.
  const dest = path.resolve("src/data/news.json");
  if (fs.existsSync(dest)) {
    console.warn(`\n⚠ News import failed (${e.message}) — keeping the existing news.json. Build continues.`);
    process.exit(0);
  }
  console.error(e);
  process.exit(1);
});
