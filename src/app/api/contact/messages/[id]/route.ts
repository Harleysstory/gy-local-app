import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/contact/messages/<id> { read: boolean } — admin only */
export async function PATCH(req: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { id } = await params;
    const b = await req.json().catch(() => null);
    const read = b?.read ? 1 : 0;
    await db.execute({
      sql: "UPDATE messages SET read = ? WHERE id = ?",
      args: [read, id],
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/** DELETE /api/contact/messages/<id> — admin only */
export async function DELETE(req: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { id } = await params;
    await db.execute({ sql: "DELETE FROM messages WHERE id = ?", args: [id] });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
