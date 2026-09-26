import Link from "next/link";
import { notFound } from "next/navigation";
import { metaFor } from "@/lib/categories";
import { places } from "@/lib/places";
import type { Place } from "@/lib/places";
import { getDb } from "@/lib/db";
import PlaceUserPanel from "@/components/PlaceUserPanel";

/** Manual (added-by-you) places live in the DB, not the JSON — look there too. */
async function findPlace(id: string): Promise<Place | undefined> {
  const jsonHit = places.find((x) => x.id === id);
  if (jsonHit) return jsonHit;
  const db = getDb();
  if (!db) return undefined;
  try {
    const rs = await db.execute({
      sql: "SELECT id, name, category, lat, lon, address, website, source FROM places WHERE id = ? AND status = 'approved'",
      args: [id],
    });
    const r = rs.rows[0];
    if (!r) return undefined;
    return {
      id: String(r.id),
      name: String(r.name),
      category: String(r.category),
      lat: Number(r.lat),
      lon: Number(r.lon),
      address: (r.address as string) ?? null,
      website: (r.website as string) ?? null,
      source: "manual",
    };
  } catch {
    return undefined;
  }
}

export const dynamic = "force-dynamic"; // 1,154 places → render on demand, not at build

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = places.find((x) => x.id === id);
  return { title: p ? `${p.name} — GY Local` : "Place — GY Local" };
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await findPlace(id);
  if (!p) notFound();

  const { emoji, color } = metaFor(p.category);
  const lowConfidence = p.confidence !== null && p.confidence !== undefined && p.confidence < 0.3;

  return (
    <div className="space-y-8">
      <Link href="/map" className="text-sm text-sky-400 hover:text-sky-300">
        ← Back to map
      </Link>

      <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{p.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: color }}
              />
              {emoji} {p.category}
            </div>
          </div>
          <a
            href={`https://www.openstreetmap.org/directions?to=${p.lat},${p.lon}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-500"
          >
            Route me ↗
          </a>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          {p.address && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Address</dt>
              <dd className="text-slate-300">{p.address}</dd>
            </div>
          )}
          {p.website && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Website</dt>
              <dd>
                <a
                  href={p.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:text-sky-300"
                >
                  {p.website.replace(/^https?:\/\/(www\.)?/, "").slice(0, 50)} ↗
                </a>
              </dd>
            </div>
          )}
          {p.phone && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Phone</dt>
              <dd className="text-slate-300">{p.phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Source</dt>
            <dd className="text-slate-300">
              {p.source === "manual" ? "Added by you" : "Overture Maps"}
              {lowConfidence && (
                <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                  low confidence ({p.confidence}) — verify details
                </span>
              )}
            </dd>
          </div>
        </dl>
        <a
          href={`/contact?type=report&place=${encodeURIComponent(p.name)}`}
          className="mt-4 inline-block text-xs text-slate-500 transition hover:text-sky-400"
        >
          🐞 Something wrong with this listing? Report it →
        </a>
      </div>

      <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
        <PlaceUserPanel placeId={p.id} />
      </div>
    </div>
  );
}
