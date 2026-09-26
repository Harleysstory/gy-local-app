import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { computeBins, validateConfig, type BinConfig } from "@/lib/bins";

async function readConfig(): Promise<BinConfig | null> {
  const db = getDb();
  if (!db) return null;
  const rs = await db.execute("SELECT value FROM settings WHERE key = 'bins'");
  const raw = rs.rows[0]?.value;
  if (!raw) return null;
  try {
    return JSON.parse(String(raw)) as BinConfig;
  } catch {
    return null;
  }
}

/** GET /api/bins → { configured, config?, state? } */
export async function GET() {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const cfg = await readConfig();
    if (!cfg) return Response.json({ configured: false });
    return Response.json({ configured: true, config: cfg, state: computeBins(cfg) });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/** PUT /api/bins { weekday, anchorDate, anchorBin } */
export async function PUT(req: Request) {
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised — owner login required" }, { status: 401 });
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const cfg = validateConfig(await req.json().catch(() => null));
    if (!cfg) {
      return Response.json(
        { error: "Invalid config: need weekday 0-6, anchorBin green|black, and an anchorDate that falls on that weekday" },
        { status: 400 }
      );
    }
    await db.execute({
      sql: `INSERT INTO settings (key, value) VALUES ('bins', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [JSON.stringify(cfg)],
    });
    return Response.json({ ok: true, configured: true, config: cfg, state: computeBins(cfg) });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/** DELETE /api/bins → clear the stored config (owner only) */
export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised — owner login required" }, { status: 401 });
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    await db.execute("DELETE FROM settings WHERE key = 'bins'");
    return Response.json({ ok: true, configured: false });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
