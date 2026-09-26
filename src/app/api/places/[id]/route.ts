import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/places/<id> { action: "approve" | "reject" } — admin only */
export async function PATCH(req: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const action = body?.action;
    if (action !== "approve" && action !== "reject")
      return Response.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
    await db.execute({
      sql: "UPDATE places SET status = ? WHERE id = ?",
      args: [action === "approve" ? "approved" : "rejected", id],
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/** DELETE /api/places/<id> — admin only (remove any manual place) */
export async function DELETE(req: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { id } = await params;
    await db.execute({ sql: "DELETE FROM places WHERE id = ?", args: [id] });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
