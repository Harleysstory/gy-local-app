/** GET /api/favourites → legacy server-side favourites (read-only archive).
 *  Personal favourites now live in each visitor's browser (localStore).
 *  This endpoint exists only for the owner's one-time import on /admin. */
export async function GET() {
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  if (!db) return Response.json([]);
  try {
    const rs = await db.execute("SELECT place_id FROM favourites ORDER BY created_at DESC");
    return Response.json(rs.rows.map((r) => r.place_id));
  } catch {
    return Response.json([]);
  }
}
