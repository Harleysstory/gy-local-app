"use client";

import { useState } from "react";
import {
  computeBins,
  validateConfig,
  type BinConfig,
  type Bin,
} from "@/lib/bins";
import { getBins, setBins as saveBins, clearBins } from "@/lib/localStore";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const prettyDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

/**
 * Bin day — every visitor's own schedule, stored in their browser.
 * (GYBC pattern: black & green bins alternate weekly on a fixed weekday.)
 */
export default function BinDayCard() {
  const [cfg, setCfg] = useState<BinConfig | null>(() => getBins());
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [weekday, setWeekday] = useState("3"); // Wednesday default
  const [anchorBin, setAnchorBin] = useState<Bin>("green");
  const [anchorDate, setAnchorDate] = useState("");

  const save = () => {
    setError("");
    const candidate = validateConfig({
      weekday: Number(weekday),
      anchorBin,
      anchorDate,
    });
    if (!candidate) {
      setError(
        !anchorDate
          ? "Pick the date of a recent collection."
          : `That date isn't a ${WEEKDAYS[Number(weekday)]} — pick a ${WEEKDAYS[Number(weekday)]} collection.`
      );
      return;
    }
    saveBins(candidate);
    setCfg(candidate);
    setEditing(false);
  };

  const reset = () => {
    clearBins();
    setCfg(null);
    setEditing(true);
  };

  if (!cfg || editing) {
    return (
      <div>
        <div className="mt-2 space-y-2 text-sm">
          <p className="text-xs text-slate-400">
            Black &amp; green bins alternate weekly. Set your pattern once —
            it stays on this device:
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
            Date = the most recent {WEEKDAYS[Number(weekday)]} collection (must
            be the {anchorBin} bin week).
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={save}
              className="flex-1 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-500"
            >
              Save bin pattern
            </button>
            {cfg && (
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-700"
              >
                cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const s = computeBins(cfg);
  return (
    <div className="mt-2 text-sm">
      {s.next.isToday ? (
        <p>
          <span
            className={`rounded px-1.5 py-0.5 font-semibold ${
              s.next.bin === "green"
                ? "bg-green-500/20 text-green-300"
                : "bg-slate-500/20 text-slate-200"
            }`}
          >
            {s.next.bin.toUpperCase()} BIN
          </span>{" "}
          — collection TODAY (out by 6:30am)
        </p>
      ) : s.next.isTomorrow ? (
        <p>
          <span
            className={`rounded px-1.5 py-0.5 font-semibold ${
              s.next.bin === "green"
                ? "bg-green-500/20 text-green-300"
                : "bg-slate-500/20 text-slate-200"
            }`}
          >
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
      <button
        onClick={reset}
        className="mt-2 text-xs text-slate-500 hover:text-slate-300"
      >
        edit pattern
      </button>
    </div>
  );
}
