import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

/** GET /api/contact/messages — admin only: all contact messages */
export async function GET(req: Request) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised" }, { status: 401 });
  try {
    const rs = await db.execute(
      "SELECT * FROM messages ORDER BY created_at DESC"
    );
    return Response.json(rs.rows);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
