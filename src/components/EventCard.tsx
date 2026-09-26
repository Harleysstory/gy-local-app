"use client";

import type { LocalEvent } from "@/lib/events";

export default function EventCard({ ev }: { ev: LocalEvent }) {
  return (
    <a
      href={ev.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-800 transition hover:ring-sky-500"
    >
      {ev.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ev.image}
          alt=""
          className="h-32 w-full object-cover opacity-80 transition group-hover:opacity-100"
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-slate-800 text-3xl">
          🗓️
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="text-xs font-medium text-sky-400">{ev.date_text}</div>
        <div className="text-sm font-semibold leading-tight">{ev.title}</div>
        {ev.desc && <p className="line-clamp-2 text-xs text-slate-400">{ev.desc}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">visitgreatyarmouth.co.uk ↗</span>
          <span
            role="button"
            tabIndex={0}
            title="Download .ics for your phone calendar"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(`/api/events/${ev.id}/ics`, "_blank");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                window.open(`/api/events/${ev.id}/ics`, "_blank");
              }
            }}
            className="cursor-pointer text-xs text-sky-400 hover:text-sky-300"
          >
            ＋ calendar
          </span>
        </div>
      </div>
    </a>
  );
}
