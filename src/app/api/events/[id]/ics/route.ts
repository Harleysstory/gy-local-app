import { events } from "@/lib/events";

function icsDate(iso: string, addDays = 0): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString().replace(/-/g, "").split("T")[0];
}

function icsStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Escape text for ICS (commas and semicolons must be escaped, newlines joined) */
function esc(s: string): string {
  return s.replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

/** GET /api/events/<id>/ics → downloadable calendar entry */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ev = events.find((e) => e.id === id);
  if (!ev) return new Response("Event not found", { status: 404 });

  // All-day entry; DTEND is exclusive for all-day events, so single days end next day.
  const dtStart = icsDate(ev.starts_at ?? "");
  const dtEnd = ev.ends_at
    ? icsDate(ev.ends_at, 1) // cover the final day
    : icsDate(ev.starts_at ?? "", 1);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GY Local//EN",
    "BEGIN:VEVENT",
    `UID:gy-local-${ev.id}@visitgreatyarmouth`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${esc(ev.title)}`,
    ...(ev.desc ? [`DESCRIPTION:${esc(ev.desc)}`] : []),
    `URL:${ev.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="gy-event-${ev.id}.ics"`,
    },
  });
}
