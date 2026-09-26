export type LocalEvent = {
  id: string;
  title: string;
  url: string;
  desc: string;
  image: string | null;
  date_label: string;
  date_text: string;
  starts_at: string | null; // YYYY-MM-DD
  ends_at: string | null; // YYYY-MM-DD
  recurring: boolean;
  source: string;
};

import imported from "@/data/events.json";

const data = imported as {
  scrapedAt: string;
  events: LocalEvent[];
  needsReview: LocalEvent[];
};

export const events: LocalEvent[] = data.events;
export const needsReview: LocalEvent[] = data.needsReview;
export const scrapedAt: string = data.scrapedAt;

/** Today's date in Europe/London as YYYY-MM-DD */
export function londonToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

/** Dates (YYYY-MM-DD) of the upcoming Saturday & Sunday in Europe/London */
export function upcomingWeekend(): { sat: string; sun: string } {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun … 6=Sat
  const daysToSat = (6 - dow + 7) % 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysToSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
  return { sat: fmt(sat), sun: fmt(sun) };
}

export function prettyDate(iso: string | null): string {
  if (!iso) return "Date TBC";
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  });
}
