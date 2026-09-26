import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/places/<id>/note → your note for one place (or null) */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const rs = await db.execute({
      sql: "SELECT * FROM notes WHERE place_id = ?",
      args: [id],
    });
    return Response.json(rs.rows[0] ?? null);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/** PUT /api/places/<id>/note → upsert {rating?, tags?, body?} */
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised — owner login required" }, { status: 401 });
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const body = await req.json();
    const rating = Number.isFinite(body.rating) ? Math.round(body.rating) : null;
    if (rating !== null && (rating < 1 || rating > 5)) {
      return Response.json({ error: "rating must be 1–5" }, { status: 400 });
    }
    const tags = String(body.tags ?? "").slice(0, 200);
    const text = String(body.body ?? "").slice(0, 2000);

    await db.execute({
      sql: `INSERT INTO notes (place_id, rating, tags, body, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))
           ON CONFLICT(place_id) DO UPDATE SET
             rating = excluded.rating, tags = excluded.tags,
             body = excluded.body, updated_at = datetime('now')`,
      args: [id, rating, tags, text],
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/** DELETE /api/places/<id>/note → remove your note */
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised — owner login required" }, { status: 401 });
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    await db.execute({ sql: "DELETE FROM notes WHERE place_id = ?", args: [id] });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
