"use client";

import { useEffect, useState } from "react";

type Bin = "green" | "black";
type BinsResponse = {
  configured: boolean;
  config?: { weekday: number; anchorDate: string; anchorBin: Bin };
  state?: {
    next: { date: string; bin: Bin; isToday: boolean; isTomorrow: boolean };
    following: { date: string; bin: Bin };
  };
  error?: string;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const prettyDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export default function BinDayCard() {
  const [data, setData] = useState<BinsResponse | null>(null);
  const [dbDown, setDbDown] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [weekday, setWeekday] = useState("3"); // Wednesday default
  const [anchorBin, setAnchorBin] = useState<Bin>("green");
  const [anchorDate, setAnchorDate] = useState("");

  const refresh = () =>
    fetch("/api/bins")
      .then((r) => (r.status === 503 ? (setDbDown(true), null) : r.json()))
      .then((d) => d && setData(d))
      .catch(() => setDbDown(true));

  useEffect(() => {
    refresh();
  }, []);

  const save = async () => {
    setError("");
    if (!anchorDate) {
      setError("Pick the date of a recent collection.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/bins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekday: Number(weekday),
          anchorBin,
          anchorDate,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 401
            ? "Owner login required — sign in at /login first."
            : j.error ?? "Could not save — is that date a " + WEEKDAYS[Number(weekday)] + "?"
        );
      } else {
        setData(j);
        setEditing(false);
      }
    } catch {
      setError("Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setEditing(true);
    setData(null);
    await fetch("/api/bins", { method: "DELETE" }).catch(() => {});
  };

  if (dbDown) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        Database not configured — set Turso credentials in .env.local.
      </p>
    );
  }

  const setupForm = (
    <div className="mt-2 space-y-2 text-sm">
      <p className="text-xs text-slate-400">
        Black &amp; green bins alternate weekly. Tell me your pattern once:
      </p>
      <select
        value={weekday}
        onChange={(e) => setWeekday(e.target.value)}
        className="w-full rounded-lg bg-slate-800 px-2 py-1.5 text-sm ring-1 ring-slate-700"
      >
        {WEEKDAYS.map((d, i) => (
          <option key={d} value={i}>
            Collected on {d}s
          </option>
        ))}
      </select>
      <select
        value={anchorBin}
        onChange={(e) => setAnchorBin(e.target.value as Bin)}
        className="w-full rounded-lg bg-slate-800 px-2 py-1.5 text-sm ring-1 ring-slate-700"
      >
        <option value="green">…and the GREEN bin goes out this week</option>
        <option value="black">…and the BLACK bin goes out this week</option>
      </select>
      <input
        type="date"
        value={anchorDate}
        onChange={(e) => setAnchorDate(e.target.value)}
        className="w-full rounded-lg bg-slate-800 px-2 py-1.5 text-sm text-slate-200 ring-1 ring-slate-700"
      />
      <p className="text-[11px] text-slate-500">
        Date = the most recent {WEEKDAYS[Number(weekday)]} collection (must be the{" "}
        {anchorBin} bin week).
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save bin pattern"}
      </button>
    </div>
  );

  if (!data || editing || !data.configured) {
    return (
      <div>
        {data && data.configured && (
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">editing</span>
            <button onClick={() => { setEditing(false); refresh(); }} className="text-xs text-sky-400">
              cancel
            </button>
          </div>
        )}
        {setupForm}
      </div>
    );
  }

  const s = data.state!;
  return (
    <div className="mt-2 text-sm">
      {s.next.isToday ? (
        <p>
          <span className={`rounded px-1.5 py-0.5 font-semibold ${s.next.bin === "green" ? "bg-green-500/20 text-green-300" : "bg-slate-500/20 text-slate-200"}`}>
            {s.next.bin.toUpperCase()} BIN
          </span>{" "}
          — collection TODAY (out by 6:30am)
        </p>
      ) : s.next.isTomorrow ? (
        <p>
          <span className={`rounded px-1.5 py-0.5 font-semibold ${s.next.bin === "green" ? "bg-green-500/20 text-green-300" : "bg-slate-500/20 text-slate-200"}`}>
            {s.next.bin.toUpperCase()} BIN
          </span>{" "}
          — put it out TONIGHT
        </p>
      ) : (
        <p>
          Next up <span className="font-semibold">{s.next.bin}</span> —{" "}
          {prettyDate(s.next.date)}
        </p>
      )}
      <p className="mt-1 text-xs text-slate-400">
        Then {s.following.bin} on {prettyDate(s.following.date)} · out by 6:30am
      </p>
      <button onClick={reset} className="mt-2 text-xs text-slate-500 hover:text-slate-300">
        edit pattern
      </button>
    </div>
  );
}
