/** GET /api/notes → legacy server-side notes (read-only archive).
 *  Personal notes now live in each visitor's browser (localStore).
 *  This endpoint exists only for the owner's one-time import on /admin. */
export async function GET() {
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  if (!db) return Response.json([]);
  try {
    const rs = await db.execute("SELECT * FROM notes ORDER BY updated_at DESC");
    return Response.json(rs.rows);
  } catch {
    return Response.json([]);
  }
}
