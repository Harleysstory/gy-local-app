import { getDb } from "@/lib/db";
import { pushConfigured, sendPush } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/push/test { endpoint } — one test notification to your OWN
 * subscription, so any subscriber can verify alerts work end-to-end without
 * waiting for the morning brief. The endpoint must already be subscribed.
 */
export async function POST(req: Request) {
  if (!pushConfigured()) {
    return Response.json({ error: "Push not configured" }, { status: 503 });
  }
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const body = await req.json().catch(() => null);
    const endpoint = String(body?.endpoint ?? "");
    if (!endpoint) {
      return Response.json({ error: "Missing endpoint" }, { status: 400 });
    }

    const rs = await db.execute(
      "SELECT subscription FROM push_subscriptions WHERE endpoint = ?",
      [endpoint]
    );
    const row = rs.rows[0] as unknown as { subscription: string } | undefined;
    if (!row) {
      return Response.json(
        { error: "No subscription found — toggle alerts off and on again" },
        { status: 404 }
      );
    }

    const sub = JSON.parse(row.subscription) as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
    await sendPush(sub, {
      title: "GY Local — test ✓",
      body: "Town alerts are working on this device. Your morning brief arrives ~7:30am.",
      url: "/",
      tag: "gy-test",
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
