import Link from "next/link";
import BinDayCard from "@/components/BinDayCard";
import AlertsCard from "@/components/AlertsCard";
import { places } from "@/lib/places";
import { getWeather } from "@/lib/weather";
import { getTides, upcomingExtremes, londonTime } from "@/lib/tides";

export const revalidate = 900; // weather 15 min; tides fetch caches itself for 6h

const NOWCAST_STYLE: Record<string, string> = {
  dry: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  easing: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  rain: "bg-slate-500/20 text-slate-300 ring-1 ring-slate-400/30",
  incoming: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
};

export default async function Home() {
  const [w, tides] = await Promise.all([getWeather(), getTides()]);
  const next = upcomingExtremes(tides.extremes);
  const nextLow = next.find((e) => e.type === "low");
  const nextHigh = next.find((e) => e.type === "high");

  // Golden hour ≈ 40 min before sunset; low tide near sunset = beach walk alert
  let goldenHour: string | undefined;
  let lowTideNearSunset = false;
  if (w.ok && w.sunsetIso) {
    const sunset = new Date(w.sunsetIso);
    const golden = new Date(sunset.getTime() - 40 * 60_000);
    goldenHour = golden.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London",
    });
    if (nextLow) {
      lowTideNearSunset =
        Math.abs(new Date(nextLow.time).getTime() - sunset.getTime()) <= 2 * 3_600_000;
    }
  }

  return (
    <div className="space-y-8">
      {/* ─── Today hero: weather + nowcast ─── */}
      <section className="rounded-2xl bg-gradient-to-br from-sky-950 to-slate-900 p-6 ring-1 ring-slate-800">
        <p className="text-sm uppercase tracking-widest text-sky-400">
          Great Yarmouth
        </p>
        <h1 className="mt-1 text-3xl font-bold">Today in your town</h1>
        {w.ok ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <div className="text-5xl font-bold">{w.temp}°C</div>
              <div className="text-sm text-slate-400">now · wind {w.wind} km/h</div>
            </div>
            <div className="text-sm text-slate-300">
              <div>
                Today: {w.min}° – {w.max}°
              </div>
              <div className="text-slate-400">Rain chance: {w.rainProb}%</div>
            </div>
            <div className="text-sm text-slate-300">
              <div>🌅 Sunrise {w.sunrise}</div>
              <div>🌇 Sunset {w.sunset}</div>
            </div>
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                NOWCAST_STYLE[w.nowcast.label] ?? NOWCAST_STYLE.rain
              }`}
            >
              {w.nowcast.text}
            </span>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Weather unavailable — the rest still works.
          </p>
        )}
      </section>

      {/* ─── Sponsor ─── */}
      <a
        href="https://www.bradfordindependent.com"
        target="_blank"
        rel="noreferrer"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 p-5 ring-1 ring-amber-500/25 transition hover:ring-amber-400/50"
      >
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-400/90">
            Proudly sponsored by
          </p>
          <p className="mt-0.5 text-lg font-bold text-slate-100">
            Bradford Independent
          </p>
          <p className="text-xs text-slate-400">
            Business analysis, service design &amp; UX · Great Yarmouth
          </p>
        </div>
        <span className="rounded-lg bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-300 ring-1 ring-amber-400/30">
          bradfordindependent.com ↗
        </span>
      </a>

      {/* ─── Dashboard cards ─── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <h2 className="font-semibold">🌊 Tides</h2>
          {tides.ok && next.length > 0 ? (
            <div className="mt-2 space-y-1.5 text-sm">
              {nextLow && (
                <div>
                  Low <span className="text-sky-300">{londonTime(nextLow.time)}</span>{" "}
                  <span className="text-slate-400">({nextLow.height}m)</span>
                </div>
              )}
              {nextHigh && (
                <div>
                  High <span className="text-sky-300">{londonTime(nextHigh.time)}</span>{" "}
                  <span className="text-slate-400">({nextHigh.height}m)</span>
                </div>
              )}
              {nextLow && (
                <p className="text-xs text-slate-400">
                  Best beach walk: ±2h around {londonTime(nextLow.time)}
                </p>
              )}
              {tides.stale && tides.fetchedAt && (
                <p className="text-[11px] text-amber-400/90">
                  ⚠ cached · fetched{" "}
                  {Math.max(1, Math.round((Date.now() - new Date(tides.fetchedAt).getTime()) / 3_600_000))}h ago — live
                  quota resets daily
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              {tides.keyMissing
                ? "Tides unavailable — set STORMGLASS_API_KEY in .env.local"
                : tides.ok
                  ? "No upcoming tides in the cached window — back with the next refresh."
                  : "Tide data temporarily unavailable (free-tier quota or service) — the morning refresh refills it."}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <h2 className="font-semibold">🗑️ Bin day</h2>
          <BinDayCard />
        </div>

        <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <h2 className="font-semibold">🔔 Town alerts</h2>
          <AlertsCard />
          <Link
            href="/alerts"
            className="mt-3 inline-block text-xs text-sky-400 hover:text-sky-300"
          >
            See what&apos;s in the daily brief →
          </Link>
        </div>

        <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <h2 className="font-semibold">🌇 This evening</h2>
          {w.ok && w.sunset ? (
            <div className="mt-2 space-y-1.5 text-sm">
              <div>
                Golden hour ≈{" "}
                <span className="text-amber-300">{goldenHour}</span>
              </div>
              <div>
                Sunset <span className="text-sky-300">{w.sunset}</span>
              </div>
              {lowTideNearSunset && (
                <p className="rounded-lg bg-emerald-500/15 px-2 py-1.5 text-xs text-emerald-300 ring-1 ring-emerald-500/30">
                  Low tide near sunset — perfect evening beach walk
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Sunset times unavailable right now.
            </p>
          )}
        </div>
      </section>

      {/* ─── Jump links ─── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/map"
          className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800 transition hover:ring-sky-500"
        >
          <h3 className="font-semibold">🗺️ The map</h3>
          <p className="mt-1 text-sm text-slate-400">
            {places.length} places across Yarmouth &amp; Gorleston, with your
            ratings and favourites.
          </p>
        </Link>
        <Link
          href="/events"
          className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800 transition hover:ring-sky-500"
        >
          <h3 className="font-semibold">🗓️ What&apos;s on</h3>
          <p className="mt-1 text-sm text-slate-400">
            Live from Visit Great Yarmouth — today, this weekend, and coming up.
          </p>
        </Link>
        <Link
          href="/news"
          className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800 transition hover:ring-sky-500"
        >
          <h3 className="font-semibold">📰 Local news</h3>
          <p className="mt-1 text-sm text-slate-400">
            The Mercury, EDP24, BBC and more — what the town is talking about.
          </p>
        </Link>
        <Link
          href="/add-place"
          className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800 transition hover:ring-sky-500"
        >
          <h3 className="font-semibold">＋ Add a place</h3>
          <p className="mt-1 text-sm text-slate-400">
            Missing from the map? Add it yourself — you approve it in admin.
          </p>
        </Link>
      </section>
    </div>
  );
}
