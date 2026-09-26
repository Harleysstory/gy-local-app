"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { places } from "@/lib/places";
import type { Place } from "@/lib/places";
import { categoryCounts, metaFor } from "@/lib/categories";
import { loadPersonal, type PersonalNote } from "@/lib/localStore";

// Leaflet needs `window`, so the map must never render on the server:
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[65vh] w-full animate-pulse rounded-xl bg-slate-900" />
  ),
});

const LIST_CAP = 60; // keep the DOM list light; the map shows everything

export default function MapPage() {
  const [selected, setSelected] = useState<string | null>(null); // null = all
  const [subSelected, setSubSelected] = useState<string | null>(null); // inside Other
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, PersonalNote>>({});
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [userPlaces, setUserPlaces] = useState<Place[]>([]); // community-approved places

  // Personal layer: this visitor's notes/favourites — browser-local, never
  // sent anywhere. Public layer: community-approved places come from server:
  useEffect(() => {
    const p = loadPersonal();
    setNotes(p.notes);
    setFavourites(new Set(p.favourites));
    fetch("/api/places/approved")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Place[]) => setUserPlaces(rows))
      .catch(() => {});
  }, []);

  const all = useMemo(() => [...places, ...userPlaces], [userPlaces]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(
      (p) =>
        (selected === null || p.category === selected) &&
        (selected !== "Other" ||
          subSelected === null ||
          (p.subcategory ?? "(none)") === subSelected) &&
        (q === "" || p.name.toLowerCase().includes(q))
    );
  }, [selected, subSelected, search, all]);

  // Subsection chips — shown when you're inside the "Other" category
  const subChips = useMemo(() => {
    if (selected !== "Other") return [];
    const m = new Map<string, number>();
    for (const p of all) {
      if (p.category !== "Other") continue;
      const k = p.subcategory ?? "(none)";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [selected, all]);

  const merged: Place[] = useMemo(
    () =>
      filtered.map((p) => ({
        ...p,
        note: notes[p.id]?.body ?? undefined,
        rating: notes[p.id]?.rating ?? null,
        favourite: favourites.has(p.id),
      })),
    [filtered, notes, favourites]
  );

  const chips = useMemo(() => categoryCounts(all), [all]);
  const withNotes = Object.keys(notes).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Map</h1>
        <div className="flex items-center gap-3">
          <Link href="/add-place" className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500">
            ＋ Add place
          </Link>
          <span className="text-xs text-slate-500">
            {merged.length} shown · {all.length} total
            {withNotes > 0 && ` · ♥ ${favourites.size} · ★ ${withNotes} with your notes`}
          </span>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search places… (e.g. chippy, pier, pharmacy)"
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm ring-1 ring-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-sky-500"
      />

      {/* Category chips — legend + filter in one */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setSelected(null); setSubSelected(null); }}
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
            selected === null
              ? "bg-sky-600 text-white ring-sky-600"
              : "bg-slate-900 text-slate-300 ring-slate-800 hover:ring-slate-600"
          }`}
        >
          All · {all.length}
        </button>
        {chips.map(({ category, count }) => {
          const { emoji, color } = metaFor(category);
          const active = selected === category;
          return (
            <button
              key={category}
              onClick={() => {
                setSelected(active ? null : category);
                setSubSelected(null);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                active
                  ? "text-white ring-white/40"
                  : "bg-slate-900 text-slate-300 ring-slate-800 hover:ring-slate-600"
              }`}
              style={active ? { background: color } : undefined}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: color }}
              />
              {emoji} {category} · {count}
            </button>
          );
        })}
      </div>

      {/* Subsection chips — inside "Other" */}
      {subChips.length > 0 && (
        <div className="-mt-1 flex flex-wrap gap-1.5">
          <button
            onClick={() => setSubSelected(null)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] ring-1 transition ${
              subSelected === null
                ? "bg-slate-200 text-slate-900 ring-slate-200"
                : "bg-slate-900 text-slate-400 ring-slate-800 hover:text-white"
            }`}
          >
            All Others
          </button>
          {subChips.map(([sub, n]) => (
            <button
              key={sub}
              onClick={() => setSubSelected(subSelected === sub ? null : sub)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] ring-1 transition ${
                subSelected === sub
                  ? "bg-slate-200 text-slate-900 ring-slate-200"
                  : "bg-slate-900 text-slate-400 ring-slate-800 hover:text-white"
              }`}
            >
              {sub} · {n}
            </button>
          ))}
        </div>
      )}

      <MapView places={merged} />

      {/* List of what's currently shown */}
      <div>
        {merged.length > LIST_CAP && (
          <p className="mb-2 text-xs text-slate-500">
            Showing first {LIST_CAP} of {merged.length} — keep typing in search
            to narrow down.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {merged.slice(0, LIST_CAP).map((p) => {
            const { emoji, color } = metaFor(p.category);
            return (
              <Link
                key={p.id}
                href={`/place/${p.id}`}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 ring-1 ring-slate-800 transition hover:ring-sky-500"
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: color }}
                  title={p.category}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm">
                    {p.source === "manual" && (
                      <span className="text-amber-400" title="Added by you">
                        ⭐{" "}
                      </span>
                    )}
                    {p.favourite && <span className="text-pink-400">♥ </span>}
                    {typeof p.rating === "number" && (
                      <span className="text-amber-400">
                        {"★".repeat(p.rating)}{" "}
                      </span>
                    )}
                    {p.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {emoji} {p.category}
                    {p.subcategory ? (
                      <span className="text-slate-500"> · {p.subcategory}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Tip: click a chip to isolate an industry, click a place for details and
        your notes, use ⭐ ratings and ♥ favourites on any place page.
      </p>
      <Link href="/" className="text-sm text-sky-400 hover:text-sky-300">
        ← Back home
      </Link>
    </div>
  );
}
