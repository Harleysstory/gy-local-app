import eventsJson from "@/data/events.json";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { pushConfigured, sendPush, type PushPayload } from "@/lib/push";
import { getWeather } from "@/lib/weather";
import { getTides, upcomingExtremes, londonTime } from "@/lib/tides";
import { computeBins, londonToday, type BinConfig } from "@/lib/bins";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIN_INTERVAL_MS = 12 * 3_600_000; // at most one brief per 12h

/** Compose today's brief text (weather + tides + events, + bin line per sub) */
async function composeBrief(binConfig: BinConfig | null): Promise<PushPayload> {
  const [w, tides] = await Promise.all([getWeather(), getTides()]);
  const next = upcomingExtremes(tides.extremes);
  const low = next.find((e) => e.type === "low");
  const today = londonToday();
  const todaysEvents = (eventsJson as { events: { starts_at: string | null; title: string; recurring: boolean }[] })
    .events.filter((e) => e.starts_at === today || (e.recurring && e.starts_at !== null));

  const lines: string[] = [];

  if (w.ok) {
    lines.push(
      `${Math.round(w.temp ?? 0)}° now, ${Math.round(w.min ?? 0)}–${Math.round(w.max ?? 0)}° today, ` +
        `${w.rainProb ?? 0}% rain — ${w.nowcast.text.replace(/^Raining now — /, "rain ").replace(/^Dry now — /, "")}`
    );
  }
  if (low) lines.push(`Low tide ${londonTime(low.time)} (best beach walk ±2h)`);
  if (todaysEvents.length > 0) {
    lines.push(
      `On today: ${todaysEvents[0].title}` +
        (todaysEvents.length > 1 ? ` +${todaysEvents.length - 1} more` : "")
    );
  }
  if (binConfig) {
    const s = computeBins(binConfig);
    if (s.next.isToday) lines.push(`🗑️ ${s.next.bin.toUpperCase()} BIN — collection day`);
    else if (s.next.isTomorrow) lines.push(`🗑️ Put the ${s.next.bin} bin out tonight`);
  }

  return {
    title: "Great Yarmouth — good morning",
    body: lines.join(" · ") || "Have a good day in the town.",
    url: "/",
    tag: "gy-brief",
  };
}

/**
 * GET /api/push/brief — the morning town brief, sent to all subscribers.
 *  - Called daily by the Vercel cron (06:30 UTC)
 *  - ?dry=1 — compose + return the text, send nothing (testing)
 *  - ?force=1 — bypass the 12h rate limit (owner, from the admin dashboard)
 */
export async function GET(req: Request) {
  if (!pushConfigured()) {
    return Response.json({ error: "Push not configured (VAPID keys missing)" }, { status: 503 });
  }
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const force = url.searchParams.get("force") === "1";

  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });

  // Rate limit (skip when dry, or when force + admin)
  if (!dry) {
    if (force && !isAdminRequest(req)) {
      return Response.json({ error: "Not authorised to force" }, { status: 401 });
    }
    if (!force) {
      const rs = await db.execute("SELECT value FROM settings WHERE key = 'last_brief'");
      const last = rs.rows[0]?.value ? Number(rs.rows[0].value) : 0;
      if (Date.now() - last < MIN_INTERVAL_MS) {
        return Response.json({ ok: false, error: "Brief sent within the last 12h" }, { status: 429 });
      }
    }
  }

  const subsRs = await db.execute("SELECT endpoint, subscription, bin_config FROM push_subscriptions");
  const rows = subsRs.rows as unknown as { endpoint: string; subscription: string; bin_config: string | null }[];
  if (rows.length === 0) {
    const preview = await composeBrief(null);
    return Response.json({
      ok: true, sent: 0, subscribers: 0,
      preview: preview.body, title: preview.title, body: preview.body,
    });
  }

  // Dry: compose one example and return it (full payload so the admin
  // tester can render the notification exactly as a subscriber would see it)
  if (dry) {
    const bin = rows[0].bin_config ? (JSON.parse(rows[0].bin_config) as BinConfig) : null;
    const preview = await composeBrief(bin);
    return Response.json({
      ok: true, sent: 0, subscribers: rows.length,
      preview: preview.body, title: preview.title, body: preview.body,
    });
  }

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const sub = JSON.parse(row.subscription);
      const bin = row.bin_config ? (JSON.parse(row.bin_config) as BinConfig) : null;
      const payload = await composeBrief(bin);
      await sendPush(sub, payload);
      sent++;
      await db.execute({
        sql: "UPDATE push_subscriptions SET failure_count = 0 WHERE endpoint = ?",
        args: [row.endpoint],
      });
    } catch (e) {
      failed++;
      const msg = String(e).toLowerCase();
      const dead = msg.includes("404") || msg.includes("410") || msg.includes("no longer") || msg.includes("unsubscribe");
      if (dead) {
        await db.execute({
          sql: "DELETE FROM push_subscriptions WHERE endpoint = ?",
          args: [row.endpoint],
        });
      } else {
        const rs2 = await db.execute(
          "SELECT failure_count FROM push_subscriptions WHERE endpoint = ?",
          [row.endpoint]
        );
        const fails = Number(rs2.rows[0]?.failure_count ?? 0) + 1;
        if (fails >= 5) {
          await db.execute({
            sql: "DELETE FROM push_subscriptions WHERE endpoint = ?",
            args: [row.endpoint],
          });
        } else {
          await db.execute({
            sql: "UPDATE push_subscriptions SET failure_count = ? WHERE endpoint = ?",
            args: [fails, row.endpoint],
          });
        }
      }
    }
  }

  // Record the send
  await db.execute({
    sql: `INSERT INTO settings (key, value) VALUES ('last_brief', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [String(Date.now())],
  });

  return Response.json({ ok: true, sent, failed, subscribers: rows.length });
}
