/**
 * The personal layer — notes, ratings, favourites, bin-day config —
 * stored in THIS browser (localStorage). Nothing here is ever sent to a
 * server: each visitor's data is truly local to them, no accounts needed.
 *
 * Import only from client components ("use client").
 */

export type PersonalNote = {
  rating: number | null;
  tags: string;
  body: string;
  updatedAt: string;
};

export type BinConfigLocal = {
  weekday: number; // 0=Sun … 6=Sat
  anchorDate: string; // YYYY-MM-DD
  anchorBin: "green" | "black";
};

export type Personal = {
  notes: Record<string, PersonalNote>;
  favourites: string[];
  bins: BinConfigLocal | null;
};

const KEY = "gy-personal-v1";

const EMPTY: Personal = { notes: {}, favourites: [], bins: null };

export function loadPersonal(): Personal {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<Personal>;
    return {
      notes: p.notes ?? {},
      favourites: p.favourites ?? [],
      bins: p.bins ?? null,
    };
  } catch {
    return EMPTY;
  }
}

function save(p: Personal) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

// ---- Notes ----

export function getNote(placeId: string): PersonalNote | null {
  return loadPersonal().notes[placeId] ?? null;
}

export function setNote(placeId: string, note: Omit<PersonalNote, "updatedAt">) {
  const p = loadPersonal();
  p.notes[placeId] = { ...note, updatedAt: new Date().toISOString() };
  save(p);
}

export function deleteNote(placeId: string) {
  const p = loadPersonal();
  delete p.notes[placeId];
  save(p);
}

export function allNotes(): Record<string, PersonalNote> {
  return loadPersonal().notes;
}

// ---- Favourites ----

export function isFavourite(placeId: string): boolean {
  return loadPersonal().favourites.includes(placeId);
}

/** Toggle; returns the new state */
export function toggleFavourite(placeId: string): boolean {
  const p = loadPersonal();
  p.favourites = p.favourites.includes(placeId)
    ? p.favourites.filter((x) => x !== placeId)
    : [placeId, ...p.favourites];
  save(p);
  return p.favourites.includes(placeId);
}

export function allFavourites(): string[] {
  return loadPersonal().favourites;
}

// ---- Bin day ----

export function getBins(): BinConfigLocal | null {
  return loadPersonal().bins;
}

export function setBins(cfg: BinConfigLocal) {
  const p = loadPersonal();
  p.bins = cfg;
  save(p);
}

export function clearBins() {
  const p = loadPersonal();
  p.bins = null;
  save(p);
}

// ---- One-time migration from the old server-side system ----

/**
 * Import notes/favourites that used to live in Turso (pre-multi-user era).
 * Used once by the owner from the admin dashboard.
 */
export function mergeFromServer(
  rows: { place_id: string; rating: number | null; tags: string | null; body: string | null; updated_at?: string }[],
  favIds: string[]
): number {
  const p = loadPersonal();
  let count = 0;
  for (const r of rows) {
    if (!p.notes[r.place_id]) {
      p.notes[r.place_id] = {
        rating: r.rating,
        tags: r.tags ?? "",
        body: r.body ?? "",
        updatedAt: r.updated_at ?? new Date().toISOString(),
      };
      count++;
    }
  }
  for (const id of favIds) {
    if (!p.favourites.includes(id)) p.favourites.push(id);
  }
  save(p);
  return count;
}
