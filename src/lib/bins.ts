/**
 * Bin-day logic: GYBC collects green (recycling) and black (waste) bins on
 * ALTERNATE WEEKS on a fixed weekday per address (verified against the
 * council's published pattern). One-time manual setup, then this computes
 * "which bin tonight" forever.
 *
 * Config: weekday (0=Sun…6=Sat), anchorDate = a past collection date of the
 * anchorBin (must fall on that weekday), anchorBin = which bin was collected
 * on that date.
 */

export type Bin = "green" | "black";
export type BinConfig = { weekday: number; anchorDate: string; anchorBin: Bin };
export type BinState = {
  next: { date: string; bin: Bin; isToday: boolean; isTomorrow: boolean };
  following: { date: string; bin: Bin };
};

export const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const DAY_MS = 86_400_000;
const toUtc = (dateStr: string) => new Date(`${dateStr}T12:00:00Z`);

const addDays = (dateStr: string, n: number) => {
  const d = toUtc(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const diffDays = (a: string, b: string) =>
  Math.round((toUtc(a).getTime() - toUtc(b).getTime()) / DAY_MS);

export function londonToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

const other = (b: Bin): Bin => (b === "green" ? "black" : "green");

const binFor = (date: string, cfg: BinConfig): Bin =>
  Math.round(diffDays(date, cfg.anchorDate) / 7) % 2 === 0
    ? cfg.anchorBin
    : other(cfg.anchorBin);

export function computeBins(cfg: BinConfig): BinState {
  const today = londonToday();
  const todayDow = toUtc(today).getUTCDay();
  const daysAhead = (cfg.weekday - todayDow + 7) % 7;
  const nextDate = addDays(today, daysAhead);
  const followingDate = addDays(nextDate, 7);
  return {
    next: {
      date: nextDate,
      bin: binFor(nextDate, cfg),
      isToday: daysAhead === 0,
      isTomorrow: daysAhead === 1,
    },
    following: {
      date: followingDate,
      bin: binFor(followingDate, cfg),
    },
  };
}

export function prettyDate(dateStr: string): string {
  return toUtc(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/London",
  });
}

export function validateConfig(body: unknown): BinConfig | null {
  const b = body as Partial<BinConfig>;
  if (typeof b.weekday !== "number" || !Number.isInteger(b.weekday)) return null;
  if (b.weekday < 0 || b.weekday > 6) return null;
  if (b.anchorBin !== "green" && b.anchorBin !== "black") return null;
  if (typeof b.anchorDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.anchorDate))
    return null;
  if (Number.isNaN(toUtc(b.anchorDate).getTime())) return null;
  // The anchor collection must itself fall on the configured weekday:
  if (toUtc(b.anchorDate).getUTCDay() !== b.weekday) return null;
  return { weekday: b.weekday, anchorDate: b.anchorDate, anchorBin: b.anchorBin };
}
