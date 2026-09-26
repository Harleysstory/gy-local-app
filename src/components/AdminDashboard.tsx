"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import placesJson from "@/data/imported-places.json";
import eventsJson from "@/data/events.json";
import newsJson from "@/data/news.json";

type ManualPlace = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  address: string | null;
  website: string | null;
  note: string | null;
  status: string;
  source: string;
  created_at: string;
};

type NoteRow = {
  place_id: string;
  rating: number | null;
  tags: string | null;
  body: string | null;
  updated_at?: string;
};

type Stats = {
  places: { pending: number; approved: number; rejected: number };
  notes: number;
  favourites: number;
  unread_messages: number;
};

type Message = {
  id: number;
  name: string | null;
  email: string | null;
  kind: string;
  body: string;
  read: number;
  created_at: string;
};

const jsonPlaces = placesJson as { id: string; name: string }[];
const eventCount = (eventsJson as { events: unknown[] }).events.length;
const eventsScrapedAt = (eventsJson as { scrapedAt: string }).scrapedAt;
const newsCount = (newsJson as { items: unknown[] }).items.length;
const newsFetchedAt = (newsJson as { fetchedAt: string }).fetchedAt;

export default function AdminDashboard() {
  const [busy, setBusy] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<ManualPlace[]>([]);
  const [approved, setApproved] = useState<ManualPlace[]>([]);
  const [rejected, setRejected] = useState<ManualPlace[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const load = useCallback(async () => {
    const [st, p, a, r, n, f, m] = await Promise.all([
      fetch("/api/admin/stats").then((x) => x.json()),
      fetch("/api/places?status=pending").then((x) => x.json()),
      fetch("/api/places?status=approved").then((x) => x.json()),
      fetch("/api/places?status=rejected").then((x) => x.json()),
      fetch("/api/notes").then((x) => (x.ok ? x.json() : [])),
      fetch("/api/favourites").then((x) => (x.ok ? x.json() : [])),
      fetch("/api/contact/messages").then((x) => (x.ok ? x.json() : [])),
    ]);
    setStats(st.error ? null : st);
    setPending(Array.isArray(p) ? p : []);
    setApproved(Array.isArray(a) ? a : []);
    setRejected(Array.isArray(r) ? r : []);
    setNotes(Array.isArray(n) ? (n as NoteRow[]) : []);
    setFavIds(Array.isArray(f) ? (f as string[]) : []);
    setMessages(Array.isArray(m) ? (m as Message[]) : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject" | "delete") {
    setBusy(id + action);
    try {
      if (action === "delete") {
        await fetch(`/api/places/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/places/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      }
      await load();
    } finally {
      setBusy("");
    }
  }

  async function deleteNote(placeId: string) {
    setBusy("note-" + placeId);
    try {
      await fetch(`/api/places/${placeId}/note`, { method: "DELETE" });
      await load();
    } finally {
      setBusy("");
    }
  }

  async function toggleMessageRead(m: Message) {
    setBusy("msg-" + m.id);
    try {
      await fetch(`/api/contact/messages/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: !m.read }),
      });
      await load();
    } finally {
      setBusy("");
    }
  }

  async function deleteMessage(id: number) {
    setBusy("msg-del-" + id);
    try {
      await fetch(`/api/contact/messages/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy("");
    }
  }

  async function deleteFav(placeId: string) {
    setBusy("fav-" + placeId);
    try {
      await fetch(`/api/favourites/${placeId}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy("");
    }
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  };

  const nameOf = (id: string): string => {
    const j = jsonPlaces.find((p) => p.id === id);
    if (j?.name) return j.name;
    const m = approved.find((p) => p.id === id);
    if (m?.name) return m.name;
    return `Unknown (${id.slice(0, 12)}…)`;
  };

  const fmtWhen = (iso: string | undefined) =>
    iso
      ? new Date(iso).toLocaleString("en-GB", {
          timeZone: "Europe/London",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "never";
  const stale = (iso: string | undefined) =>
    iso ? Date.now() - new Date(iso).getTime() > 2 * 86_400_000 : true;

  const StatCard = ({ icon, value, label }: { icon: string; value: number | null; label: string }) => (
    <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800 transition hover:ring-sky-500/50">
      <div className="text-2xl">{icon}</div>
      <div className="mt-1 text-xl font-bold">{value ?? "…"}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );

  const PlaceList = ({
    title,
    items,
    actions,
  }: {
    title: string;
    items: ManualPlace[];
    actions: { action: "approve" | "reject" | "delete"; label: string; style: string }[];
  }) => (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {title} · {items.length}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">Nothing here.</p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">{p.name}</div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {p.category} · {Number(p.lat).toFixed(5)}, {Number(p.lon).toFixed(5)}
                    {p.address ? ` · ${p.address}` : ""}
                  </div>
                  {p.note && (
                    <p className="mt-1 max-w-lg text-xs italic text-slate-400">“{p.note}”</p>
                  )}
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      {p.website.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)} ↗
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {actions.map(({ action, label, style }) => (
                    <button
                      key={action}
                      onClick={() => act(p.id, action)}
                      disabled={busy === p.id + action}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${style}`}
                    >
                      {busy === p.id + action ? "…" : label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-sky-400">Owner area</p>
          <h1 className="text-2xl font-bold">Admin dashboard</h1>
        </div>
        <button
          onClick={logout}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-800 transition hover:text-white hover:ring-sky-500"
        >
          Sign out
        </button>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="⏳" value={stats?.places.pending ?? null} label="Pending places" />
        <StatCard icon="⭐" value={stats?.places.approved ?? null} label="Your places on map" />
        <StatCard icon="✉️" value={stats?.unread_messages ?? null} label="Unread contact" />
        <StatCard icon="📝" value={stats?.notes ?? null} label="Notes & ratings" />
        <StatCard icon="♥" value={stats?.favourites ?? null} label="Favourites" />
        <StatCard icon="🗓️" value={eventCount} label="Events loaded" />
        <StatCard icon="📰" value={newsCount} label="News articles" />
      </section>

      {/* Data freshness */}
      <section className="rounded-xl bg-slate-900 p-4 text-xs text-slate-400 ring-1 ring-slate-800">
        <span className="font-semibold text-slate-300">Data freshness:</span>{" "}
        places — {jsonPlaces.length} imported (re-run{" "}
        <code>npm run import:overture</code> after downloading new tiles) · events —{" "}
        {fmtWhen(eventsScrapedAt)}
        {stale(eventsScrapedAt) && (
          <span className="text-amber-400"> (stale — run npm run scrape:events)</span>
        )}{" "}
        · news — {fmtWhen(newsFetchedAt)}
        {stale(newsFetchedAt) && (
          <span className="text-amber-400"> (stale — run npm run import:news)</span>
        )}
      </section>

      {/* Place approvals */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">📍 Place approvals</h2>
        <PlaceList
          title="Pending"
          items={pending}
          actions={[
            { action: "approve", label: "✓ Approve", style: "bg-emerald-600 text-white hover:bg-emerald-500" },
            { action: "reject", label: "✕ Reject", style: "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:ring-red-400" },
          ]}
        />
        <PlaceList
          title="Approved (on the map)"
          items={approved}
          actions={[
            { action: "reject", label: "Take down", style: "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:ring-amber-400" },
            { action: "delete", label: "Delete", style: "bg-slate-800 text-slate-400 ring-1 ring-slate-700 hover:ring-red-400" },
          ]}
        />
        <PlaceList
          title="Rejected"
          items={rejected}
          actions={[
            { action: "approve", label: "✓ Approve after all", style: "bg-emerald-600 text-white hover:bg-emerald-500" },
            { action: "delete", label: "Delete forever", style: "bg-slate-800 text-slate-400 ring-1 ring-slate-700 hover:ring-red-400" },
          ]}
        />
      </section>

      {/* Contact messages */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          ✉️ Contact messages{" "}
          <span className="text-sm font-normal text-slate-500">
            · {messages.length} total, {messages.filter((m) => !m.read).length} unread
          </span>
        </h2>
        {messages.length === 0 ? (
          <p className="text-xs text-slate-500">
            No messages yet — enquiries, reports and suggestions from the
            contact page land here.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl p-4 ring-1 transition ${
                  m.read ? "bg-slate-900/60 ring-slate-800/60" : "bg-slate-900 ring-sky-500/40"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />}
                      {m.name ?? "Anonymous"}
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                        {m.kind}
                      </span>
                    </div>
                    {m.email && (
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your GY Local message")}`}
                        className="text-xs text-sky-400 hover:text-sky-300"
                      >
                        {m.email} — reply ↗
                      </a>
                    )}
                    <p className="mt-1.5 max-w-xl whitespace-pre-wrap text-xs text-slate-300">
                      {m.body}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {fmtWhen(m.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => toggleMessageRead(m)}
                      disabled={busy === "msg-" + m.id}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 ring-1 ring-slate-700 transition hover:ring-sky-500 disabled:opacity-40"
                    >
                      {busy === "msg-" + m.id ? "…" : m.read ? "mark unread" : "mark read"}
                    </button>
                    <button
                      onClick={() => deleteMessage(m.id)}
                      disabled={busy === "msg-del-" + m.id}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-700 transition hover:ring-red-400 disabled:opacity-40"
                    >
                      {busy === "msg-del-" + m.id ? "…" : "delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Your data */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            📝 Notes ({notes.length})
          </h3>
          {notes.length === 0 ? (
            <p className="text-xs text-slate-500">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => (
                <div
                  key={n.place_id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-slate-900 p-3 ring-1 ring-slate-800"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{nameOf(n.place_id)}</div>
                    <div className="text-xs text-slate-400">
                      {typeof n.rating === "number" && "★".repeat(n.rating)}
                      {n.tags ? ` · ${n.tags}` : ""}
                    </div>
                    {n.body && (
                      <p className="mt-0.5 max-w-md text-xs italic text-slate-400">
                        “{n.body.slice(0, 120)}
                        {n.body.length > 120 ? "…" : ""}”
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteNote(n.place_id)}
                    disabled={busy === "note-" + n.place_id}
                    className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-700 transition hover:ring-red-400 disabled:opacity-40"
                  >
                    {busy === "note-" + n.place_id ? "…" : "delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            ♥ Favourites ({favIds.length})
          </h3>
          {favIds.length === 0 ? (
            <p className="text-xs text-slate-500">No favourites yet.</p>
          ) : (
            <div className="space-y-2">
              {favIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 p-3 ring-1 ring-slate-800"
                >
                  <div className="min-w-0 truncate text-sm">{nameOf(id)}</div>
                  <button
                    onClick={() => deleteFav(id)}
                    disabled={busy === "fav-" + id}
                    className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-700 transition hover:ring-red-400 disabled:opacity-40"
                  >
                    {busy === "fav-" + id ? "…" : "remove"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/add-place"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          ＋ Add a place
        </Link>
        <Link
          href="/map"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-800 hover:ring-sky-500"
        >
          Open map
        </Link>
        <Link
          href="/"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-800 hover:ring-sky-500"
        >
          Home (bin-day setup)
        </Link>
      </section>
    </div>
  );
}
