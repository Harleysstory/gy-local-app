import { getDb } from "@/lib/db";

/** GET /api/notes → all your notes [{place_id, rating, tags, body, updated_at}] */
export async function GET() {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const rs = await db.execute("SELECT * FROM notes ORDER BY updated_at DESC");
    return Response.json(rs.rows);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
