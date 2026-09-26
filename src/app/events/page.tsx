import Link from "next/link";
import EventCard from "@/components/EventCard";
import type { LocalEvent } from "@/lib/events";
import {
  events,
  londonToday,
  needsReview,
  scrapedAt,
  upcomingWeekend,
} from "@/lib/events";

export const metadata = { title: "Events — GY Local" };

function Section({
  title,
  items,
}: {
  title: string;
  items: LocalEvent[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">
        {title}{" "}
        <span className="text-sm font-normal text-slate-500">· {items.length}</span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((ev) => (
          <EventCard key={ev.id} ev={ev} />
        ))}
      </div>
    </section>
  );
}

export default function EventsPage() {
  const today = londonToday();
  const { sat, sun } = upcomingWeekend();

  const todayEvents = events.filter((e) => e.starts_at === today);
  const weekendEvents = events.filter(
    (e) => (e.starts_at === sat || e.starts_at === sun) && !e.recurring
  );
  const upcoming = events.filter(
    (e) =>
      e.starts_at !== null &&
      e.starts_at > today &&
      e.starts_at !== sat &&
      e.starts_at !== sun &&
      !e.recurring
  );
  const recurring = events.filter(
    (e) =>
      e.recurring ||
      (e.starts_at !== null &&
        e.starts_at < today &&
        e.ends_at !== null &&
        e.ends_at >= today)
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">What&apos;s on</h1>
        <p className="text-xs text-slate-500">
          Scraped from Visit Great Yarmouth · last updated{" "}
          {new Date(scrapedAt).toLocaleString("en-GB", {
            timeZone: "Europe/London",
          })}{" "}
          · re-run <code>npm run scrape:events</code> for the latest
        </p>
      </div>

      <section className="rounded-2xl bg-sky-500/10 p-4 ring-1 ring-sky-500/30">
        <p className="text-sm text-slate-200">
          Never miss what&apos;s on — the{" "}
          <Link href="/alerts" className="font-semibold text-sky-400 underline hover:text-sky-300">
            free morning brief 🔔
          </Link>{" "}
          lands on your phone at ~7:30am with today&apos;s events, weather and
          tides.
        </p>
      </section>

      <Section title="Today" items={todayEvents} />
      <Section title="This weekend" items={weekendEvents} />
      <Section title="Coming up" items={upcoming} />
      <Section title="Recurring & seasonal" items={recurring} />

      {events.length === 0 && (
        <p className="text-sm text-slate-400">
          No events loaded yet — run{" "}
          <code>npm run scrape:events</code> in the project folder.
        </p>
      )}
      {needsReview.length > 0 && (
        <p className="text-xs text-slate-500">
          {needsReview.length} event(s) had unclear dates and are held back
          until you add them manually.
        </p>
      )}
    </div>
  );
}
