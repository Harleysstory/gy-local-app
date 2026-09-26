"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import placesJson from "@/data/imported-places.json";
import eventsJson from "@/data/events.json";
import newsJson from "@/data/news.json";
import {
  allNotes,
  allFavourites,
  deleteNote as deleteNoteLocal,
  toggleFavourite,
  mergeFromServer,
  type PersonalNote,
} from "@/lib/localStore";

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

type Stats = {
  places: { pending: number; approved: number; rejected: number };
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
  const [notes, setNotes] = useState<Record<string, PersonalNote>>({});
  const [favIds, setFavIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [refreshMsg, setRefreshMsg] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [briefTest, setBriefTest] = useState<{
    title: string;
    body: string;
    subscribers: number;
  } | null>(null);

  const load = useCallback(async () => {
    const [st, p, a, r, m] = await Promise.all([
      fetch("/api/admin/stats").then((x) => x.json()),
      fetch("/api/places?status=pending").then((x) => x.json()),
      fetch("/api/places?status=approved").then((x) => x.json()),
      fetch("/api/places?status=rejected").then((x) => x.json()),
      fetch("/api/contact/messages").then((x) => (x.ok ? x.json() : [])),
    ]);
    setStats(st.error ? null : st);
    setPending(Array.isArray(p) ? p : []);
    setApproved(Array.isArray(a) ? a : []);
    setRejected(Array.isArray(r) ? r : []);
    setMessages(Array.isArray(m) ? (m as Message[]) : []);
    // Personal layer — this browser's local data (no server involved):
    setNotes(allNotes());
    setFavIds(allFavourites());
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
    deleteNoteLocal(placeId);
    setNotes(allNotes());
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
    toggleFavourite(placeId);
    setFavIds(allFavourites());
  }

  /** One-time: bring the old server-side notes/favourites into this device */
  async function importServerData() {
    setBusy("import");
    setImportMsg("");
    try {
      const [rows, favs] = await Promise.all([
        fetch("/api/notes").then((x) => (x.ok ? x.json() : [])),
        fetch("/api/favourites").then((x) => (x.ok ? x.json() : [])),
      ]);
      const n = mergeFromServer(rows, favs);
      setNotes(allNotes());
      setFavIds(allFavourites());
      setImportMsg(
        `Imported ${n} note${n === 1 ? "" : "s"} and your favourites from the old server — local to this device now.`
      );
    } catch {
      setImportMsg("Import failed — try again.");
    } finally {
      setBusy("");
      setTimeout(() => setImportMsg(""), 8000);
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
        <StatCard icon="⭐" value={stats?.places.approved ?? null} label="Community places" />
        <StatCard icon="✉️" value={stats?.unread_messages ?? null} label="Unread contact" />
        <StatCard icon="📝" value={Object.keys(notes).length} label="My notes (this device)" />
        <StatCard icon="♥" value={favIds.length} label="My favourites" />
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

      {/* My data — stored in THIS browser (the personal layer is device-local) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-800/60 p-3 ring-1 ring-slate-700">
          <p className="max-w-lg text-xs text-slate-400">
            📱 Notes &amp; favourites live in <b>this browser</b> — no accounts,
            nothing sent to a server, same as every visitor&apos;s device.
          </p>
          <button
            onClick={importServerData}
            disabled={busy === "import"}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-sky-400 ring-1 ring-slate-700 transition hover:ring-sky-500 disabled:opacity-40"
          >
            {busy === "import" ? "Importing…" : "⬇ Import my old server data (one-time)"}
          </button>
          {importMsg && <span className="text-xs text-emerald-400">{importMsg}</span>}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            📝 My notes ({Object.keys(notes).length})
          </h3>
          {Object.keys(notes).length === 0 ? (
            <p className="text-xs text-slate-500">No notes on this device yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(notes).map(([placeId, n]) => (
                <div
                  key={placeId}
                  className="flex items-start justify-between gap-3 rounded-xl bg-slate-900 p-3 ring-1 ring-slate-800"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{nameOf(placeId)}</div>
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
                    onClick={() => deleteNote(placeId)}
                    className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-700 transition hover:ring-red-400"
                  >
                    delete
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
                    className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-700 transition hover:ring-red-400"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </section>

      {/* Refresh data */}
      <section className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
        <button
          onClick={async () => {
            setBusy("refresh");
            try {
              const r = await fetch("/api/refresh");
              const j = await r.json();
              setRefreshMsg(j.ok ? j.message : j.error ?? "Could not trigger refresh.");
            } catch {
              setRefreshMsg("Could not trigger refresh.");
            } finally {
              setBusy("");
              setTimeout(() => setRefreshMsg(""), 6000);
            }
          }}
          disabled={busy === "refresh"}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy === "refresh" ? "Triggering…" : "🔄 Refresh data now"}
        </button>
        <button
          onClick={async () => {
            setBusy("brief");
            try {
              const r = await fetch("/api/push/brief?force=1");
              const j = await r.json();
              setRefreshMsg(
                j.ok
                  ? `Brief sent to ${j.sent} of ${j.subscribers} subscriber${j.subscribers === 1 ? "" : "s"}${j.failed ? ` (${j.failed} failed)` : ""}`
                  : j.error ?? "Could not send."
              );
            } catch {
              setRefreshMsg("Could not send brief.");
            } finally {
              setBusy("");
              setTimeout(() => setRefreshMsg(""), 8000);
            }
          }}
          disabled={busy === "brief"}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
        >
          {busy === "brief" ? "Sending…" : "🔔 Send town brief now"}
        </button>
        <button
          onClick={async () => {
            setBusy("brieftest");
            setBriefTest(null);
            try {
              const r = await fetch("/api/push/brief?dry=1");
              const j = await r.json();
              if (j.ok) {
                setBriefTest({ title: j.title, body: j.body, subscribers: j.subscribers });
              } else {
                setRefreshMsg(j.error ?? "Could not compose brief.");
                setTimeout(() => setRefreshMsg(""), 8000);
              }
            } catch {
              setRefreshMsg("Could not compose brief.");
              setTimeout(() => setRefreshMsg(""), 8000);
            } finally {
              setBusy("");
            }
          }}
          disabled={busy === "brieftest"}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600 disabled:opacity-50"
        >
          {busy === "brieftest" ? "Composing…" : "🔍 Test today's brief"}
        </button>
        <p className="max-w-md text-xs text-slate-400">
          Data refreshes every morning at 06:20 UTC (scraped at build time);
          the town brief goes to push subscribers at 06:30 UTC — force it here
          to send, or run a test to preview it without sending.
        </p>
        {refreshMsg && (
          <span className="text-xs text-sky-400">{refreshMsg}</span>
        )}
        {briefTest && (
          <div className="w-full">
            {/* Phone-style notification mockup: what a subscriber sees */}
            <div className="mx-auto w-full max-w-sm rounded-2xl bg-slate-800/95 p-3 ring-1 ring-slate-700 shadow-lg">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icon.png"
                  alt=""
                  className="mt-0.5 h-9 w-9 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      GY LOCAL
                    </span>
                    <span className="text-[11px] text-slate-500">now</span>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {briefTest.title}
                  </p>
                  <p className="text-sm leading-snug text-slate-200">
                    {briefTest.body}
                  </p>
                </div>
              </div>
            </div>
            <p className="mx-auto mt-2 max-w-sm text-center text-xs text-slate-400">
              Live compose — {briefTest.subscribers} subscriber
              {briefTest.subscribers === 1 ? "" : "s"} would receive this
              right now. Nothing was sent.
            </p>
          </div>
        )}
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
