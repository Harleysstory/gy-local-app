#!/usr/bin/env node
/**
 * Import Overture Maps Places for Great Yarmouth — one or more exports.
 *
 * Usage:
 *   node scripts/import-overture.mjs <path> [<path> ...]
 *
 * Each <path> can be a place-layer GeoJSON file, or a folder of Overture
 * GeoJSON exports (the place layer is found automatically).
 *
 * Overlapping exports are expected: the same POI appears in adjacent tiles
 * with the SAME Overture id. Dedupe is by id, keeping the copy with the
 * higher confidence — so your existing notes (keyed by place id) survive
 * re-imports.
 *
 * Handles both Overture schemas:
 *   - Explorer export:  basic_category / taxonomy, feature-level id
 *   - Raw Overture:     categories.main, properties.id
 *
 * Writes src/data/imported-places.json
 */

import fs from "node:fs";
import path from "node:path";

const BBOX = { latMin: 52.54, latMax: 52.66, lonMin: 1.67, lonMax: 1.79 };

// ---- Category mapping (Explorer `basic_category` values seen in GY data) ----
const CATEGORY_MAP = {
  // Food & Drink
  restaurant: "Food & Drink", casual_eatery: "Food & Drink",
  fast_food_restaurant: "Food & Drink", cafe: "Food & Drink",
  coffee_shop: "Food & Drink", bar: "Food & Drink",
  brewery: "Food & Drink", lounge: "Food & Drink",
  food_and_beverage_store: "Food & Drink", food_service: "Food & Drink",
  nightlife_venue: "Food & Drink",
  // Shopping
  fashion_and_apparel_store: "Shopping", flowers_and_gifts_store: "Shopping",
  electronics_store: "Shopping", convenience_store: "Shopping",
  discount_store: "Shopping", second_hand_store: "Shopping",
  books_music_and_video_store: "Shopping", arts_crafts_and_hobby_store: "Shopping",
  specialty_store: "Shopping", sporting_goods_store: "Shopping",
  hardware_home_and_garden_store: "Shopping", musical_instrument_and_pro_audio_store: "Shopping",
  // Accommodation
  hotel: "Accommodation", bed_and_breakfast: "Accommodation",
  private_lodging: "Accommodation", resort: "Accommodation",
  // Health & Wellness
  personal_or_beauty_service: "Health & Wellness", wellness_service: "Health & Wellness",
  pharmacy_and_drug_store: "Health & Wellness", medical_service: "Health & Wellness",
  specialized_health_care: "Health & Wellness", primary_care_or_general_clinic: "Health & Wellness",
  behavioral_or_mental_health_clinic: "Health & Wellness", hospital: "Health & Wellness",
  sport_or_fitness_facility: "Health & Wellness", sport_or_recreation_club: "Health & Wellness",
  swimming_pool: "Health & Wellness",
  // Entertainment
  arcade: "Entertainment", gaming_venue: "Entertainment",
  movie_theater: "Entertainment", music_venue: "Entertainment",
  performing_arts_venue: "Entertainment", museum: "Entertainment",
  casino: "Entertainment", amusement_attraction: "Entertainment",
  pier: "Entertainment", stadium_arena: "Entertainment",
  festival_venue: "Entertainment", monument: "Entertainment", zoo: "Entertainment",
  adult_entertainment_venue: "Entertainment",
  // Civic & Community
  civic_organization: "Civic & Community", social_or_community_service: "Civic & Community",
  christian_place_of_worship: "Civic & Community", religious_organization: "Civic & Community",
  place_of_worship: "Civic & Community", police_station: "Civic & Community",
  library: "Civic & Community", place_of_learning: "Civic & Community",
  elementary_school: "Civic & Community", high_school: "Civic & Community",
  education: "Civic & Community", radio_station: "Civic & Community",
  // Transport
  public_transit_facility_or_service: "Transport", parking: "Transport",
  gas_station: "Transport",
};

// Non-POI geography junk that appears in the place layer:
const EXCLUDE = new Set([
  "geographic_entities", "land_feature", "river",
]);

function categoryFor(props) {
  // Explorer export schema:
  if (props.basic_category) {
    if (EXCLUDE.has(props.basic_category)) return null; // drop feature
    if (CATEGORY_MAP[props.basic_category]) return CATEGORY_MAP[props.basic_category];
    // Prefix fallbacks:
    const c = props.basic_category;
    if (c.startsWith("b2b_")) return "Services";
    if (c.endsWith("_store")) return "Shopping";
    if (c.endsWith("_service")) return "Services";
    if (c.endsWith("_venue")) return "Entertainment";
    return "Other";
  }
  // Raw Overture schema:
  const mains = props.categories?.main;
  if (Array.isArray(mains) && mains.length) {
    const first = String(mains[0]).split(":")[0].toLowerCase();
    if (CATEGORY_MAP[first]) return CATEGORY_MAP[first];
  }
  return "Other";
}

function formatAddress(addr) {
  if (!addr) return null;
  const parts = [addr.freeform, addr.locality, addr.postcode].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

const inBox = (lat, lon) =>
  lat >= BBOX.latMin && lat <= BBOX.latMax &&
  lon >= BBOX.lonMin && lon <= BBOX.lonMax;

// ---- Resolve inputs to a list of place-layer GeoJSON files ----
const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error("Usage: node scripts/import-overture.mjs <place.geojson | folder> [more…]");
  process.exit(1);
}

const files = [];
for (const input of inputs) {
  if (!fs.existsSync(input)) {
    console.error(`Not found: ${input}`);
    process.exit(1);
  }
  if (fs.statSync(input).isDirectory()) {
    const placeFiles = fs
      .readdirSync(input)
      .filter((f) => /place.*\.geojson$/i.test(f) || (/\.geojson$/i.test(f) && fs.readdirSync(input).every((g) => !/place.*\.geojson$/i.test(g))));
    // In a folder of per-layer exports, take the place layer; in a folder of
    // mixed downloads, also take bare place files that look like place data.
    const chosen = placeFiles.filter((f) => /place.*\.geojson$/i.test(f));
    for (const f of chosen) files.push(path.join(input, f));
  } else {
    files.push(input);
  }
}
if (files.length === 0) {
  console.error("No *place*.geojson found in the given folders.");
  process.exit(1);
}

// ---- Parse each file (FeatureCollection or GeoJSON-Seq) ----
function parseFeatures(file) {
  const raw = fs.readFileSync(file, "utf8");
  const trimmed = raw.trimStart();
  if (trimmed.startsWith("{") && trimmed.includes('"FeatureCollection"')) {
    return JSON.parse(raw).features ?? [];
  }
  const feats = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (t) {
      try { feats.push(JSON.parse(t)); } catch { /* skip bad line */ }
    }
  }
  return feats;
}

// ---- Filter, transform, and dedupe across ALL inputs ----
const byId = new Map(); // Overture id → candidate place
let totalFeatures = 0;
let keptCount = 0;
let duplicateCount = 0;

for (const file of files) {
  const feats = parseFeatures(file);
  let fileKept = 0;
  for (const f of feats) {
    totalFeatures++;
    const g = f.geometry;
    if (!g || g.type !== "Point") continue;
    const [lon, lat] = g.coordinates;
    if (!inBox(lat, lon)) continue;
    const p = f.properties ?? {};
    const category = categoryFor(p);
    if (category === null) continue; // excluded junk

    const id = f.id ?? p.id ?? `${lat},${lon}`;
    const candidate = {
      id,
      name: p.names?.primary ?? p.name ?? "Unnamed",
      category,
      lat,
      lon,
      address: formatAddress(p.addresses?.[0]),
      website: p.websites?.[0] ?? null,
      phone: p.phones?.[0] ?? null,
      confidence:
        typeof p.confidence === "number" ? Math.round(p.confidence * 100) / 100 : null,
      source: "overture",
    };

    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, candidate);
      keptCount++;
      fileKept++;
    } else {
      // Same POI in another tile — keep the higher-confidence copy.
      duplicateCount++;
      const cNew = candidate.confidence ?? 0;
      const cOld = existing.confidence ?? 0;
      if (cNew > cOld) byId.set(id, candidate);
    }
  }
  console.log(`${path.basename(file)}: ${feats.length} features, ${fileKept} unique kept`);
}

const out = [...byId.values()];

// Most useful first: confident + alphabetical within category
out.sort((a, b) =>
  (b.confidence ?? 0) - (a.confidence ?? 0) || a.name.localeCompare(b.name)
);

const dest = path.resolve("src/data/imported-places.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2));

// ---- Report ----
const byCat = {};
for (const o of out) byCat[o.category] = (byCat[o.category] ?? 0) + 1;
console.log(`\n=== Merge summary ===`);
console.log(`Total features read: ${totalFeatures}`);
console.log(`Duplicate POIs across tiles (same id): ${duplicateCount} — kept higher-confidence copies`);
console.log(`Unique places written: ${out.length}`);
console.log(`By category:`);
for (const [c, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${c}`);
}
console.log(`\nWrote ${dest}`);
