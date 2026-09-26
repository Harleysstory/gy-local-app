"use client";

import { useState } from "react";
import {
  getNote,
  setNote as saveNoteLocal,
  deleteNote as deleteNoteLocal,
  isFavourite,
  toggleFavourite,
} from "@/lib/localStore";

/**
 * The personal layer — YOUR rating, tags, note & favourite for a place.
 * Everything is stored in this browser (localStorage): no account, never
 * sent anywhere. Works for every visitor, works offline.
 */
export default function PlaceUserPanel({ placeId }: { placeId: string }) {
  const [note, setNote] = useState(() => getNote(placeId));
  const [rating, setRating] = useState<number | null>(() => getNote(placeId)?.rating ?? null);
  const [tags, setTags] = useState(() => getNote(placeId)?.tags ?? "");
  const [body, setBody] = useState(() => getNote(placeId)?.body ?? "");
  const [favourite, setFavourite] = useState(() => isFavourite(placeId));
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveNoteLocal(placeId, { rating, tags, body });
    setNote({ rating, tags, body, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const remove = () => {
    deleteNoteLocal(placeId);
    setNote(null);
    setRating(null);
    setTags("");
    setBody("");
  };

  const toggle = () => {
    setFavourite(toggleFavourite(placeId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your take</h2>
        <button
          onClick={toggle}
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
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
        >
          Save
        </button>
        {note && (
          <button
            onClick={remove}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-800 transition hover:ring-red-400"
          >
            Delete note
          </button>
        )}
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
      </div>

      <p className="text-[11px] text-slate-500">
        🔒 Saved on this device only — notes are yours alone, stored in your
        browser, never sent to any server.
      </p>
    </div>
  );
}
