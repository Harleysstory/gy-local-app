import { getDb } from "@/lib/db";

/** POST /api/push/unsubscribe { endpoint } — opt out */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const body = await req.json().catch(() => null);
    if (!body?.endpoint) {
      return Response.json({ error: "endpoint required" }, { status: 400 });
    }
    await db.execute({
      sql: "DELETE FROM push_subscriptions WHERE endpoint = ?",
      args: [String(body.endpoint)],
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
