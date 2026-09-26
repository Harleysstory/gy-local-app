import type { Metadata } from "next";
import Link from "next/link";
import AlertsCard from "@/components/AlertsCard";
import BriefExample from "@/components/BriefExample";

export const metadata: Metadata = {
  title: "Town alerts — GY Local",
  description:
    "The free Great Yarmouth morning brief: weather, tides, what's on and your bin day — one friendly push notification at ~7:30am. No account, opt out anytime.",
};

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">🔔 Town alerts</h1>
        <p className="mt-2 text-slate-300">
          One friendly morning brief for Great Yarmouth, every day at ~7:30am.
          Free, no account, opt out anytime.
        </p>
      </div>

      {/* Live example of what lands on their phone */}
      <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
        <h2 className="font-semibold">What lands on your phone</h2>
        <BriefExample />
      </section>

      <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
        <h2 className="font-semibold">What&apos;s inside every brief</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>
            <span className="mr-1">☀️</span> Today&apos;s weather — temperature,
            rain chance and what it&apos;s actually doing outside
          </li>
          <li>
            <span className="mr-1">🌊</span> The low-tide window — the best time
            for a beach walk
          </li>
          <li>
            <span className="mr-1">🎪</span> What&apos;s on in town today
          </li>
          <li>
            <span className="mr-1">🗑️</span> Your bin day — if you&apos;ve set it
            in the{" "}
            <Link href="/" className="text-sky-400 underline hover:text-sky-300">
              Bin day card on Home
            </Link>{" "}
            (optional, but it makes the brief yours)
          </li>
        </ul>
      </section>

      <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
        <h2 className="font-semibold">Get the brief</h2>
        <AlertsCard />
      </section>

      <p className="text-xs leading-relaxed text-slate-500">
        How it works: this site sends your phone a web push notification — the
        same technology news apps use, but with no accounts, no tracking and no
        ads. To send the brief we store only your push subscription and, if you
        set your bins, your bin pattern so your brief can include it. Nothing
        else. Turn it off anytime and both are deleted.
      </p>
    </div>
  );
}
