"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Note = {
  place_id: string;
  rating: number | null;
  tags: string | null;
  body: string | null;
  updated_at?: string;
};

/**
 * Your personal notes + favourite for a place — the "make it yours" panel.
 * Owner-only: visitors see a locked state instead (client side stays open).
 * Talks to /api/places/<id>/note and /api/favourites.
 */
export default function PlaceUserPanel({ placeId }: { placeId: string }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbDown, setDbDown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [favourite, setFavourite] = useState(false);

  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => alive && setAuthed(!!j.authed))
      .catch(() => alive && setAuthed(false));
    (async () => {
      try {
        const r = await fetch(`/api/places/${placeId}/note`);
        if (r.status === 503) { if (alive) { setDbDown(true); setLoading(false); } return; }
        const n = await r.json();
        if (!alive) return;
        setNote(n);
        setRating(n?.rating ?? null);
        setTags(n?.tags ?? "");
        setBody(n?.body ?? "");
      } catch {
        if (alive) setDbDown(true);
      } finally {
        if (alive) setLoading(false);
      }
      try {
        const fr = await fetch("/api/favourites");
        if (fr.ok) {
          const ids: string[] = await fr.json();
          if (alive) setFavourite(ids.includes(placeId));
        }
      } catch { /* non-fatal */ }
    })();
    return () => { alive = false; };
  }, [placeId]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const r = await fetch(`/api/places/${placeId}/note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, tags, body }),
      });
      if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally {
      setSaving(false);
    }
  };

  const removeNote = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/places/${placeId}/note`, { method: "DELETE" });
      if (r.ok) { setNote(null); setRating(null); setTags(""); setBody(""); }
    } finally {
      setSaving(false);
    }
  };

  const toggleFavourite = async () => {
    const next = !favourite;
    setFavourite(next);
    try {
      if (next) {
        await fetch("/api/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ place_id: placeId }),
        });
      } else {
        await fetch(`/api/favourites/${placeId}`, { method: "DELETE" });
      }
    } catch {
      setFavourite(!next); // revert on failure
    }
  };

  if (authed === null || loading)
    return <p className="text-sm text-slate-500">Loading your notes…</p>;

  if (authed === false) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-800/60 px-4 py-3 ring-1 ring-slate-700">
        <p className="text-xs text-slate-400">
          🔒 The owner&apos;s notes &amp; ratings are private — sign in to add yours.
        </p>
        <Link
          href="/login"
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-sky-400 ring-1 ring-slate-700 hover:ring-sky-500"
        >
          Owner login →
        </Link>
      </div>
    );
  }

  if (dbDown) {
    return (
      <p className="text-sm text-slate-500">
        Database not configured — set{" "}
        <code>TURSO_DATABASE_URL</code> and <code>TURSO_AUTH_TOKEN</code> in{" "}
        <code>.env.local</code> (see README §5).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your take</h2>
        <button
          onClick={toggleFavourite}
          className={`rounded-full px-4 py-1.5 text-sm ring-1 transition ${
            favourite
              ? "bg-pink-500 text-white ring-pink-500"
              : "bg-slate-900 text-slate-300 ring-slate-800 hover:ring-slate-600"
          }`}
        >
          {favourite ? "♥ Favourite" : "♡ Add to favourites"}
        </button>
      </div>

      {/* Rating */}
      <div>
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
          Rating
        </span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(rating === n ? null : n)}
              className={`text-2xl leading-none transition ${
                rating !== null && n <= rating
                  ? "text-amber-400"
                  : "text-slate-600 hover:text-slate-400"
              }`}
              title={`${n} star${n > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
          Tags
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="great-coffee, avoid-weekends…"
          className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm ring-1 ring-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-sky-500"
        />
      </div>

      {/* Note body */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
          Note
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Anything worth remembering about this place…"
          className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm ring-1 ring-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-sky-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {note && (
          <button
            onClick={removeNote}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-800 transition hover:ring-red-400 disabled:opacity-50"
          >
            Delete note
          </button>
        )}
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
      </div>
    </div>
  );
}
