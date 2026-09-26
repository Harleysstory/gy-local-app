-- GY Local — database schema (SQLite / Turso)
-- YOUR data lives here; world data (Overture places, events, news) lives in
-- src/data/*.json and is refreshed by scripts, so imports never overwrite
-- your notes/favourites/manual places.
--
-- Apply with: node scripts/apply-schema.mjs
-- (existing tables are skipped — safe to re-run)

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

CREATE TABLE IF NOT EXISTS favourites (
  place_id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (          -- your personal ratings
  place_id TEXT NOT NULL PRIMARY KEY,       -- no FK: places live in src/data JSON, not this DB
  rating INTEGER,                 -- 1–5, your call
  tags TEXT,                      -- 'great-coffee,avoid-weekends'
  body TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_items (     -- deals, classifieds, links, ideas
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,             -- link | deal | classified | note
  title TEXT NOT NULL,
  url TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS stops (           -- filtered BODS GTFS stops (buses deferred)
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

CREATE TABLE IF NOT EXISTS settings (        -- small key-value store (bin config, etc.)
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
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

-- Lightweight full-text search across place names and your notes:
CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
  name, note, category,
  content=''
);
