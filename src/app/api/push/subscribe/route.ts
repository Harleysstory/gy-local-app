import { getDb } from "@/lib/db";

/** POST /api/push/subscribe { subscription, bin? } — opt in to town alerts.
 *  The optional bin config is the subscriber's own local pattern, sent
 *  voluntarily so their brief can include "bin out tonight". */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const body = await req.json().catch(() => null);
    const sub = body?.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 });
    }
    const bin = body?.bin ? JSON.stringify(body.bin) : null;

    await db.execute({
      sql: `INSERT INTO push_subscriptions (endpoint, subscription, bin_config)
            VALUES (?, ?, ?)
            ON CONFLICT(endpoint) DO UPDATE SET
              subscription = excluded.subscription,
              bin_config = COALESCE(excluded.bin_config, push_subscriptions.bin_config),
              failure_count = 0`,
      args: [String(sub.endpoint), JSON.stringify(sub), bin],
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
