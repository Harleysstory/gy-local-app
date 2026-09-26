"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { CATEGORY_META } from "@/lib/categories";

const PlacePicker = dynamic(() => import("@/components/PlacePicker"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-slate-900" />,
});

export default function AddPlacePage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Food & Drink");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const pick = (newLat: number, newLon: number) => {
    setLat(Math.round(newLat * 1e7) / 1e7);
    setLon(Math.round(newLon * 1e7) / 1e7);
    setError("");
  };

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, lat, lon, address, website, note }),
      });
      const j = await res.json();
      if (!res.ok) setError(j.error ?? "Could not submit");
      else setDone(true);
    } catch {
      setError("Could not submit — check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <div className="text-5xl">📍</div>
        <h1 className="text-2xl font-bold">Submitted for approval</h1>
        <p className="text-sm text-slate-400">
          It&apos;s in the queue — approve it from the admin dashboard and
          it&apos;ll appear on the map.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/admin"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Go to admin →
          </Link>
          <button
            onClick={() => {
              setDone(false);
              setName(""); setAddress(""); setWebsite(""); setNote("");
              setLat(null); setLon(null);
            }}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-800"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Add a place</h1>
        <p className="mt-1 text-sm text-slate-400">
          For the local spots Overture missed — new cafés, market stalls, the
          fish van. You&apos;ll approve it on the admin page before it goes on
          the map.
        </p>
      </div>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Place name *"
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm ring-1 ring-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-sky-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm ring-1 ring-slate-800 focus:outline-none focus:ring-sky-500"
        >
          {Object.keys(CATEGORY_META).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].emoji} {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">
          Click the map to place it *
        </p>
        <PlacePicker lat={lat} lon={lon} category={category} onPick={pick} />
        <div className="mt-2 flex gap-2">
          <input
            value={lat ?? ""}
            onChange={(e) => setLat(e.target.value ? Number(e.target.value) : null)}
            placeholder="latitude"
            inputMode="decimal"
            className="w-1/2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs ring-1 ring-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-sky-500"
          />
          <input
            value={lon ?? ""}
            onChange={(e) => setLon(e.target.value ? Number(e.target.value) : null)}
            placeholder="longitude"
            inputMode="decimal"
            className="w-1/2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs ring-1 ring-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address (optional)"
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm ring-1 ring-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-sky-500"
        />
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website (optional)"
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm ring-1 ring-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-sky-500"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Anything worth remembering about this place… (optional)"
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm ring-1 ring-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-sky-500"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting || !name || lat === null || lon === null}
        className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Submit for approval"}
      </button>
      <Link href="/map" className="block text-center text-sm text-sky-400 hover:text-sky-300">
        ← Back to map
      </Link>
    </div>
  );
}
