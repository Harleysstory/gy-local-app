"use client";

import { useEffect, useState } from "react";

type Example = { title: string; body: string } | null;

/**
 * Live example of the morning brief — composes the real thing from today's
 * weather/tides/events (the same dry run the admin tester uses) and renders
 * it as a phone-notification mockup. Sends nothing.
 */
export default function BriefExample() {
  const [example, setExample] = useState<Example>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/push/brief?dry=1")
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && j.title && j.body) {
          setExample({ title: j.title, body: j.body });
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <p className="mt-3 text-sm text-slate-400">
        Live preview isn&apos;t available right now — the brief is still sent
        every morning.
      </p>
    );
  }

  if (!example) {
    return <p className="mt-3 text-sm text-slate-500">Composing today&apos;s brief…</p>;
  }

  return (
    <div className="mt-3">
      {/* Phone-style notification mockup */}
      <div className="mx-auto w-full max-w-sm rounded-2xl bg-slate-800/95 p-3 ring-1 ring-slate-700 shadow-lg">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" className="mt-0.5 h-9 w-9 rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                GY LOCAL
              </span>
              <span className="text-[11px] text-slate-500">7:30am</span>
            </div>
            <p className="mt-0.5 text-sm font-semibold text-white">{example.title}</p>
            <p className="text-sm leading-snug text-slate-200">{example.body}</p>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-sm text-center text-xs text-slate-500">
        Composed live from today&apos;s data — exactly what subscribers get every
        morning.
      </p>
    </div>
  );
}
