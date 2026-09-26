import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const MIN_INTERVAL_MS = 6 * 3_600_000; // at most one refresh per 6 hours

/**
 * GET /api/refresh — triggers a fresh-data rebuild via the Vercel deploy hook.
 * Called daily by the Vercel cron (vercel.json) and by the "Refresh now"
 * button on the admin dashboard. Rate-limited in the DB so it can't be
 * spammed into a rebuild loop.
 */
export async function GET() {
  const hook = process.env.DEPLOY_HOOK_URL;
  if (!hook) {
    return Response.json({ ok: false, error: "DEPLOY_HOOK_URL not configured" }, { status: 503 });
  }
  try {
    // Rate limit (stored in Turso settings so it survives across instances)
    const db = getDb();
    if (db) {
      const rs = await db.execute(
        "SELECT value FROM settings WHERE key = 'last_refresh'"
      );
      const last = rs.rows[0]?.value ? Number(rs.rows[0].value) : 0;
      if (Date.now() - last < MIN_INTERVAL_MS) {
        const mins = Math.ceil((MIN_INTERVAL_MS - (Date.now() - last)) / 60000);
        return Response.json({
          ok: false,
          error: `Data was refreshed less than 6h ago (about ${mins} min left).`,
        }, { status: 429 });
      }
    }

    const r = await fetch(hook, { method: "POST" });
    if (!r.ok) {
      return Response.json({ ok: false, error: `Deploy hook returned ${r.status}` }, { status: 502 });
    }

    if (db) {
      await db.execute({
        sql: `INSERT INTO settings (key, value) VALUES ('last_refresh', ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [String(Date.now())],
      });
    }

    return Response.json({
      ok: true,
      message: "Deployment triggered — fresh data in ~2 minutes.",
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
