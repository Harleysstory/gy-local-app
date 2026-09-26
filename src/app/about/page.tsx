import Link from "next/link";

export const metadata = { title: "About — GY Local" };

const SOURCES: {
  name: string;
  what: string;
  licence: string;
  url: string;
}[] = [
  {
    name: "Overture Maps",
    what: "The places — 2,000+ businesses & points of interest across the town",
    licence: "CDLA-Permissive",
    url: "https://overturemaps.org/",
  },
  {
    name: "OpenStreetMap",
    what: "Map tiles, walking routes & the base map",
    licence: "ODbL — attribution required",
    url: "https://www.openstreetmap.org/copyright",
  },
  {
    name: "Visit Great Yarmouth",
    what: "What's on — the events calendar",
    licence: "scraped gently, always linked back",
    url: "https://www.visitgreatyarmouth.co.uk/",
  },
  {
    name: "Google News",
    what: "Local news from 20+ outlets",
    licence: "personal, non-commercial reader use",
    url: "https://news.google.com/",
  },
  {
    name: "Stormglass.io",
    what: "Seafront tides",
    licence: "free tier",
    url: "https://stormglass.io",
  },
  {
    name: "Open-Meteo",
    what: "Weather & rain nowcast",
    licence: "CC BY 4.0",
    url: "https://open-meteo.com/",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-sky-950 to-slate-900 p-8 ring-1 ring-slate-800">
        <p className="text-xs uppercase tracking-widest text-sky-400">
          About this app
        </p>
        <h1 className="mt-1 text-3xl font-bold">
          Built in Great Yarmouth, for Great Yarmouth.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          GY Local is one app for everything this town offers — the map, what&apos;s
          on, the news, the tides, even the bin day. It started as one
          resident&apos;s project and runs itself: every morning it refreshes
          with fresh events and news, with no one at a desk and no cost to
          run. It belongs to the town as much as to anyone.
        </p>
      </section>

      {/* Privacy model */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-emerald-500/20">
          <h2 className="font-semibold text-emerald-300">
            🔒 Your notes never leave your device
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Your ratings, notes, favourites and bin-day setup are stored in{" "}
            <b>your own browser</b> — never uploaded, never tracked, no
            account needed. Another person using the app sees their own
            notes, never yours. Clear your browser data and they&apos;re gone;
            that&apos;s what &quot;yours&quot; means here.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-sky-500/20">
          <h2 className="font-semibold text-sky-300">
            📍 The map is everyone&apos;s — and moderated
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Anything shared — a place someone adds, a report through the
            contact form — is reviewed by a human who actually lives here
            before it goes public. No bots, no spam pins: the map only grows
          the way the town grows it.
          </p>
        </div>
      </section>

      {/* Data & credits */}
      <section>
        <h2 className="text-xl font-semibold">Data &amp; credits</h2>
        <p className="mt-1 text-sm text-slate-400">
          This app stands on open data and free services. Every source, with
          its licence:
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-800">
          <table className="w-full text-left text-sm">
            <tbody>
              {SOURCES.map((s, i) => (
                <tr
                  key={s.name}
                  className={i % 2 ? "bg-slate-900/50" : "bg-slate-900"}
                >
                  <td className="px-4 py-3 font-medium">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:text-sky-300"
                    >
                      {s.name} ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{s.what}</td>
                  <td className="hidden px-4 py-3 text-xs text-slate-500 sm:table-cell">
                    {s.licence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Personal data (yours) lives in your browser. Shared data — approved
          community places and contact messages — lives in a Turso database
          in Ireland.
        </p>
      </section>

      {/* Bradford Independent */}
      <section className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 p-8 ring-1 ring-amber-500/25">
        <p className="text-[10px] uppercase tracking-widest text-amber-400/90">
          Built &amp; sponsored by
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-100">
          Bradford Independent
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Bradford Independent is Harley Bradford — a business analyst and
          service designer based in Great Yarmouth, working with startups,
          non-profits and community organisations on business analysis,
          service design &amp; UX, and strategy &amp; growth. This app is
          one of the practice&apos;s community projects: proof that a town
          can have its own platform, at zero cost, built by the people who
          live in it.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="https://www.bradfordindependent.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 ring-1 ring-amber-400/40 transition hover:ring-amber-300"
          >
            bradfordindependent.com ↗
          </a>
          <Link
            href="/contact"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-700 transition hover:ring-sky-500"
          >
            ✉️ Work together
          </Link>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="rounded-2xl bg-slate-900 p-6 text-center ring-1 ring-slate-800">
        <p className="text-sm text-slate-300">
          Spotted something wrong? Got an idea for the app? Want your
          business listed better?
        </p>
        <Link
          href="/contact"
          className="mt-3 inline-block rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          Get in touch →
        </Link>
      </section>
    </div>
  );
}
