import { getDb } from "@/lib/db";

/** GET /api/places/approved — public: your approved manual places (map merge) */
export async function GET() {
  const db = getDb();
  if (!db) return Response.json([]);
  try {
    const rs = await db.execute(
      `SELECT id, name, category, lat, lon, address, website, source
       FROM places WHERE status = 'approved' ORDER BY created_at DESC`
    );
    return Response.json(rs.rows);
  } catch {
    return Response.json([]);
  }
}
