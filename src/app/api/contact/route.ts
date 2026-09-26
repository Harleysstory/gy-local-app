import { getDb } from "@/lib/db";

const KINDS = new Set(["enquiry", "report", "suggestion", "other"]);

/** POST /api/contact — public contact form (enquiries, reports, suggestions) */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const b = await req.json().catch(() => null);
    if (!b) return Response.json({ error: "Invalid body" }, { status: 400 });

    // Honeypot: bots fill hidden fields — pretend success, save nothing.
    if (typeof b.honeypot === "string" && b.honeypot.length > 0) {
      return Response.json({ ok: true });
    }

    const kind = String(b.kind ?? "");
    const body = String(b.body ?? "").trim().slice(0, 3000);
    const name = String(b.name ?? "").trim().slice(0, 100) || null;
    const email = String(b.email ?? "").trim().slice(0, 200) || null;

    if (!KINDS.has(kind)) return Response.json({ error: "Pick a message type" }, { status: 400 });
    if (body.length < 2) return Response.json({ error: "Message is empty" }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "That email address doesn't look right" }, { status: 400 });
    }

    await db.execute({
      sql: "INSERT INTO messages (name, email, kind, body) VALUES (?, ?, ?, ?)",
      args: [name, email, kind, body],
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
