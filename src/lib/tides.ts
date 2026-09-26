import { getDb } from "@/lib/db";

export type TideExtreme = {
  time: string; // ISO (UTC from Stormglass)
  type: "high" | "low";
  height: number; // metres, 1dp
};

export type TidesResult = {
  ok: boolean;
  extremes: TideExtreme[];
  stale?: boolean; // served from the Turso cache (live fetch failed)
  fetchedAt?: string; // when cached data was fetched (ISO)
  keyMissing?: boolean; // no API key configured at all
};

const ENDPOINT =
  "https://api.stormglass.io/v2/tide/extremes/point?lat=52.6083&lng=1.7305";

/**
 * Tides with a Turso-backed safety net:
 *  1. Try Stormglass (fetch cached 6h by Next → ≤4 live requests/day).
 *  2. On success, persist the extremes to settings.tides_cache.
 *  3. On ANY failure (free-tier quota exhausted, service down, network),
 *     fall back to the last cached data — marked stale — instead of
 *     breaking the card. Quota resets daily; the morning cron rebuild
 *     refills the cache with fresh data.
 */
export async function getTides(): Promise<TidesResult> {
  const key = process.env.STORMGLASS_API_KEY;
  if (!key) return { ok: false, keyMissing: true, extremes: [] };

  try {
    const res = await fetch(ENDPOINT, {
      headers: { Authorization: key },
      next: { revalidate: 21600 }, // 6h data cache inside the page ISR
    });
    if (!res.ok) throw new Error(`Stormglass ${res.status}`);
    const j = await res.json();
    const data: TideExtreme[] = (j.data ?? []).map(
      (d: { time: string; type: string; height: number }) => ({
        time: d.time,
        type: d.type === "high" ? ("high" as const) : ("low" as const),
        height: Math.round(d.height * 10) / 10,
      })
    );

    // Best-effort cache write (so failures later can fall back)
    const db = getDb();
    if (db) {
      try {
        await db.execute({
          sql: `INSERT INTO settings (key, value) VALUES ('tides_cache', ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          args: [JSON.stringify({ fetchedAt: new Date().toISOString(), extremes: data })],
        });
      } catch { /* cache write must never break the page */ }
    }
    return { ok: true, extremes: data };
  } catch (e) {
    // Live fetch failed — quota exhausted, service down, whatever.
    console.warn(`[tides] live fetch failed (${e instanceof Error ? e.message : e}) — trying cache`);
    const db = getDb();
    if (db) {
      try {
        const rs = await db.execute(
          "SELECT value FROM settings WHERE key = 'tides_cache'"
        );
        const raw = rs.rows[0]?.value;
        if (raw) {
          const cached = JSON.parse(String(raw)) as {
            fetchedAt: string;
            extremes: TideExtreme[];
          };
          return {
            ok: true,
            stale: true,
            fetchedAt: cached.fetchedAt,
            extremes: cached.extremes ?? [],
          };
        }
      } catch { /* ignore */ }
    }
    return { ok: false, extremes: [] };
  }
}

/** The next N tide events after right now */
export function upcomingExtremes(extremes: TideExtreme[], n = 4): TideExtreme[] {
  const now = Date.now();
  return extremes
    .filter((e) => new Date(e.time).getTime() > now)
    .slice(0, n);
}

export function londonTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}
