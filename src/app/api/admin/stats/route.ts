import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

/** GET /api/admin/stats — server-side counts, admin only.
 *  (Personal notes/favourites are per-device now and aren't counted.) */
export async function GET(req: Request) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised" }, { status: 401 });
  try {
    const rs = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM places WHERE status = 'pending')   AS pending,
        (SELECT COUNT(*) FROM places WHERE status = 'approved')  AS approved,
        (SELECT COUNT(*) FROM places WHERE status = 'rejected')  AS rejected,
        (SELECT COUNT(*) FROM messages WHERE read = 0) AS unread_messages
    `);
    const r = rs.rows[0] ?? {};
    return Response.json({
      places: {
        pending: Number(r.pending),
        approved: Number(r.approved),
        rejected: Number(r.rejected),
      },
      unread_messages: Number(r.unread_messages),
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
