export type TideExtreme = {
  time: string; // ISO (UTC from Stormglass)
  type: "high" | "low";
  height: number; // metres, 1dp
};

/**
 * Stormglass tide extremes for Great Yarmouth (free tier: 10 requests/day —
 * the 6-hour fetch cache keeps us at ≤4/day).
 * Verified endpoint: /v2/tide/extremes/point
 */
export async function getTides(): Promise<{ ok: boolean; extremes: TideExtreme[] }> {
  const key = process.env.STORMGLASS_API_KEY;
  if (!key) return { ok: false, extremes: [] };
  try {
    const res = await fetch(
      "https://api.stormglass.io/v2/tide/extremes/point?lat=52.6083&lng=1.7305",
      { headers: { Authorization: key }, next: { revalidate: 21600 } }
    );
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    const data = (j.data ?? []).map(
      (d: { time: string; type: string; height: number }) => ({
        time: d.time,
        type: d.type === "high" ? ("high" as const) : ("low" as const),
        height: Math.round(d.height * 10) / 10,
      })
    );
    return { ok: true, extremes: data };
  } catch {
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
