import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/favourites/<id> → remove favourite (owner only) */
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised — owner login required" }, { status: 401 });
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    await db.execute({ sql: "DELETE FROM favourites WHERE place_id = ?", args: [id] });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
