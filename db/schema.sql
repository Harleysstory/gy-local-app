-- GY Local — database schema (SQLite / Turso)
--
-- This DB holds PUBLIC and SHARED state only:
--   places (community-submitted, moderated), messages (contact inbox),
--   settings (tides cache, refresh rate-limit).
-- Personal data (notes, ratings, favourites, bin-day config) lives in each
-- visitor's browser (src/lib/localStore.ts) — nothing private is stored here.
--
-- LEGACY TABLES: `notes`, `favourites` and `saved_items` are from the earlier
-- single-owner era (personal data was server-side then). They remain as a
-- read-only archive for the owner's one-time import on the admin dashboard;
-- their write APIs were removed on 26 Sep 2026. Safe to drop them after
-- importing.
--
-- Apply with: node scripts/apply-schema.mjs (re-runs skip existing tables)

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,              -- 'manual-<uuid>' for user-added places
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  address TEXT,
  website TEXT,
  note TEXT,                        -- submitter's description
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ── LEGACY (read-only archive) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favourites (
  place_id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (          -- LEGACY: personal ratings
  place_id TEXT NOT NULL PRIMARY KEY,       -- no FK: places live in src/data JSON, not this DB
  rating INTEGER,                 -- 1–5
  tags TEXT,                      -- 'great-coffee,avoid-weekends'
  body TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_items (     -- LEGACY: never used, future home is device-local
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,             -- link | deal | classified | note
  title TEXT NOT NULL,
  url TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ── PUBLIC / SHARED ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,             -- VisitGY p<number>, or manual-<slug>
  title TEXT NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  location TEXT,
  url TEXT,
  source TEXT NOT NULL,            -- visitgreatyarmouth | manual
  needs_review INTEGER DEFAULT 0, -- "Various Dates" bucket
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stops (           -- filtered BODS GTFS stops (buses, deferred)
  stop_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  is_favourite INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,             -- guid from the local RSS/XML feed
  title TEXT NOT NULL,
  url TEXT,
  published_at TEXT,
  read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (        -- shared app state (tides cache, refresh limiter)
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS push_subscriptions ( -- browser push subscribers (opt-in alerts)
  endpoint TEXT PRIMARY KEY,        -- unique browser push endpoint
  subscription TEXT NOT NULL,       -- full subscription JSON from the browser
  bin_config TEXT,                  -- optional local bin pattern (JSON, given at subscribe)
  failure_count INTEGER DEFAULT 0, -- dead-endpoint hygiene (auto-remove after repeated failures)
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (        -- contact form: enquiries, reports, suggestions
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,                       -- optional
  email TEXT,                      -- optional, for replies
  kind TEXT NOT NULL,              -- enquiry | report | suggestion | other
  body TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
