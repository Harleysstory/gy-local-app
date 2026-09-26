#!/usr/bin/env node
/**
 * Scrape events from Visit Great Yarmouth (personal use, gentle: run once a day).
 *
 * Usage:  node scripts/scrape-events.mjs
 * Output: src/data/events.json
 *
 * Structure confirmed by DOM inspection (Sep 2026):
 *   - Both /whats-on and /whats-on/events-calendar list events in
 *     <div class="Highlight ItemN ... p<ID>"> blocks (mostly different events each)
 *   - Name:   .Name a            URL: same anchor href
 *   - Desc:   .Desc
 *   - Image:  img[data-lazy-src] (lazy-loaded; noscript img as fallback)
 *   - Dates:  .Dates > .Opening  → h4 label + span.From (+ span.Delim + span.To for ranges)
 *   - Date text format: "25th September 2026" (ordinal + month name + year)
 *   - Recurring events (e.g. "Every Saturday until…") have a past From + future To
 */

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const BASE = "https://www.visitgreatyarmouth.co.uk";
const PAGES = ["/whats-on/events-calendar", "/whats-on"];

const MONTHS = {
  january: "01", february: "02", march: "03", april: "04", may: "05",
  june: "06", july: "07", august: "08", september: "09", october: "10",
  november: "11", december: "12",
};

/** "25th September 2026" → "2026-09-25" (or null) */
function parseDate(text) {
  if (!text) return null;
  const m = String(text).match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
}

const today = new Date().toISOString().slice(0, 10);

async function scrapePage(pagePath, seen, events, needsReview) {
  const res = await fetch(BASE + pagePath, {
    headers: { "User-Agent": "gy-local-personal/0.1 (personal use; 1 fetch/day)" },
  });
  if (!res.ok) throw new Error(`${pagePath} returned ${res.status}`);
  const $ = cheerio.load(await res.text());

  for (const el of $('[class*="Highlight Item"]').toArray()) {
    const cls = $(el).attr("class") ?? "";
    const idMatch = cls.match(/ p(\d+)\b/);
    if (!idMatch) continue;
    const id = idMatch[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const nameAnchor = $(el).find(".Name a").first();
    const title = nameAnchor.text().trim();
    if (!title) continue;

    const desc = ($(el).find(".Desc").first().text() ?? "")
      .replace(/\s+/g, " ")
      .trim();

    let image = $(el).find("img[data-lazy-src]").first().attr("data-lazy-src");
    if (!image) image = $(el).find("noscript img").first().attr("src");
    image = image ? new URL(image, BASE).toString() : null;

    // Date block(s):
    const opening = $(el).find(".Opening").first();
    const fromText = opening.find(".From").first().text().trim() ?? "";
    const toText = opening.find(".To").first().text().trim() ?? "";
    const label = opening.find("h4").first().text().trim(); // e.g. "Season"
    const starts_at = parseDate(fromText);
    const ends_at = parseDate(toText);

    const recurring =
      /(every|each|weekly|fortnight|monthly)/i.test(desc) ||
      (starts_at !== null && starts_at < today && ends_at !== null && ends_at >= today);

    const entry = {
      id,
      title,
      url: new URL(nameAnchor.attr("href"), BASE).toString(),
      desc: desc.slice(0, 300),
      image,
      date_label: label,
      date_text: fromText + (toText ? ` – ${toText}` : ""),
      starts_at,
      ends_at,
      recurring,
      source: "visitgreatyarmouth",
    };

    if (starts_at !== null || recurring) events.push(entry);
    else needsReview.push(entry);
  }
  console.log(`${pagePath}: total unique so far ${seen.size}`);
}

async function main() {
  const seen = new Set();
  const events = [];
  const needsReview = [];
  for (const p of PAGES) await scrapePage(p, seen, events, needsReview);

  // Upcoming first, then recurring, then anything else:
  events.sort((a, b) => {
    const aUp = a.starts_at && a.starts_at >= today ? a.starts_at : "9999";
    const bUp = b.starts_at && b.starts_at >= today ? b.starts_at : "9999";
    if (aUp !== bUp) return aUp < bUp ? -1 : 1;
    return (a.title ?? "").localeCompare(b.title ?? "");
  });

  const dest = path.resolve("src/data/events.json");
  fs.writeFileSync(
    dest,
    JSON.stringify({ scrapedAt: new Date().toISOString(), events, needsReview }, null, 2)
  );
  console.log(`\n${events.length} dated/recurring events, ${needsReview.length} need manual dates.`);
  console.log(`Wrote ${dest}`);
}

main().catch((e) => {
  // During builds (Vercel prebuild), a failed scrape must never break the
  // deploy — fall back to the existing committed events.json.
  const dest = path.resolve("src/data/events.json");
  if (fs.existsSync(dest)) {
    console.warn(`\n⚠ Scrape failed (${e.message}) — keeping the existing events.json. Build continues.`);
    process.exit(0);
  }
  console.error(e);
  process.exit(1);
});
