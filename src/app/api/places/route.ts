import { getDb } from "@/lib/db";
import { GY_BBOX } from "@/lib/places";
import { CATEGORY_META } from "@/lib/categories";
import { isAdminRequest } from "@/lib/auth";

/** POST /api/places — submit a place for approval */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  try {
    const b = await req.json().catch(() => null);
    if (!b || typeof b !== "object")
      return Response.json({ error: "Invalid body" }, { status: 400 });

    const name = String(b.name ?? "").trim().slice(0, 120);
    const category = String(b.category ?? "");
    const lat = Number(b.lat);
    const lon = Number(b.lon);
    const address = String(b.address ?? "").trim().slice(0, 300) || null;
    const website = String(b.website ?? "").trim().slice(0, 300) || null;
    const note = String(b.note ?? "").trim().slice(0, 500) || null;

    if (name.length < 2)
      return Response.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    if (!Object.hasOwn(CATEGORY_META, category))
      return Response.json({ error: "Pick a valid category" }, { status: 400 });
    if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
        lat < GY_BBOX.latMin || lat > GY_BBOX.latMax ||
        lon < GY_BBOX.lonMin || lon > GY_BBOX.lonMax)
      return Response.json(
        { error: "Location must be inside the Great Yarmouth area — click the map to place it" },
        { status: 400 }
      );
    if (website && !/^https?:\/\//i.test(website))
      return Response.json({ error: "Website must start with http:// or https://" }, { status: 400 });

    const id = `manual-${crypto.randomUUID()}`;
    await db.execute({
      sql: `INSERT INTO places (id, name, category, lat, lon, address, website, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name, category, lat, lon, address, website, note],
    });
    return Response.json({ ok: true, id, status: "pending" });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/** GET /api/places[?status=pending|approved|rejected|all] — admin only */
export async function GET(req: Request) {
  const db = getDb();
  if (!db) return Response.json({ error: "Database not configured" }, { status: 503 });
  if (!isAdminRequest(req)) return Response.json({ error: "Not authorised" }, { status: 401 });
  try {
    const status = new URL(req.url).searchParams.get("status") ?? "pending";
    const rs =
      status === "all"
        ? await db.execute("SELECT * FROM places ORDER BY created_at DESC")
        : await db.execute({
            sql: "SELECT * FROM places WHERE status = ? ORDER BY created_at DESC",
            args: [status],
          });
    return Response.json(rs.rows);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
