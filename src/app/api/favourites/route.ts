import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

/** GET /api/favourites → all favourite place ids */
export async function GET() {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const rs = await db.execute("SELECT place_id FROM favourites ORDER BY created_at DESC");
    return Response.json(rs.rows.map((r) => r.place_id));
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/** POST /api/favourites {place_id} → add favourite */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised — owner login required" }, { status: 401 });
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const { place_id } = await req.json();
    if (!place_id) return Response.json({ error: "place_id required" }, { status: 400 });
    await db.execute({
      sql: "INSERT OR IGNORE INTO favourites (place_id) VALUES (?)",
      args: [String(place_id)],
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
