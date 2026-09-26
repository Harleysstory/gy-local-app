#!/usr/bin/env node
/**
 * Filter the national BODS GTFS download down to Great Yarmouth.
 *
 * Setup:
 *   1. Register free at https://data.bus-data.dft.gov.uk/ (downloads need an account)
 *   2. Download the national GTFS ZIP from the Downloads page
 *   3. Unzip it into ./gtfs/ (stops.txt, routes.txt, trips.txt, stop_times.txt, calendar.txt, agency.txt)
 *
 * Usage:  node scripts/filter-gtfs.mjs
 * Output: src/data/transit.json — local stops, routes, and the departure rows
 *         your "next bus" board reads from.
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

const BBOX = { latMin: 52.54, latMax: 52.66, lonMin: 1.67, lonMax: 1.79 };
const GTFS_DIR = process.argv[2] ?? "./gtfs";

const read = (file) =>
  parse(fs.readFileSync(path.join(GTFS_DIR, file), "utf8"), {
    columns: true,
    skip_empty_lines: true,
  });

const inBox = (lat, lon) =>
  +lat >= BBOX.latMin && +lat <= BBOX.latMax &&
  +lon >= BBOX.lonMin && +lon <= BBOX.lonMax;

const stops = read("stops.txt").filter((s) => inBox(s.stop_lat, s.stop_lon));
const stopIds = new Set(stops.map((s) => s.stop_id));

console.log(`Local stops: ${stops.length}`);

// Trips that touch any local stop:
const stopTimes = read("stop_times.txt");
const tripIds = new Set();
for (const r of stopTimes) if (stopIds.has(r.stop_id)) tripIds.add(r.trip_id);

const trips = read("trips.txt").filter((t) => tripIds.has(t.trip_id));
const routeIds = new Set(trips.map((t) => t.route_id));
const routes = read("routes.txt").filter((r) => routeIds.has(r.route_id));
const agencies = read("agency.txt");

console.log(`Trips: ${tripIds.size}, Routes: ${routes.length}, Operators: ${new Set(routes.map(r=>r.agency_id)).size}`);

// Keep only stop_times rows for kept trips AND local stops (your departure board data):
const localStopTimes = stopTimes.filter(
  (r) => tripIds.has(r.trip_id) && stopIds.has(r.stop_id)
);

const dest = path.resolve("src/data/transit.json");
fs.writeFileSync(
  dest,
  JSON.stringify({ stops, routes, agencies, localStopTimes, trips: trips.length }, null, 2)
);
console.log(`Wrote ${dest} (${(fs.statSync(dest).size / 1e6).toFixed(1)} MB)`);
console.log("Next: load this into your DB or an API route for the departures board.");
