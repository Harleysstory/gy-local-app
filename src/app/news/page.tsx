"use client";

import { useEffect, useMemo, useState } from "react";
import newsData from "@/data/news.json";

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  source_url: string | null;
  published: string | null;
};

const items = (newsData as { fetchedAt: string; items: NewsItem[] }).items;
const fetchedAt = (newsData as { fetchedAt: string; items: NewsItem[] }).fetchedAt;
const LS_KEY = "gy-read-news";

function loadRead(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function londonDay(iso: string | null): string {
  if (!iso) return "unknown";
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function NewsRow({
  item,
  read,
  onOpen,
}: {
  item: NewsItem;
  read: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      onClick={() => onOpen(item.id)}
      className={`flex items-baseline gap-3 rounded-lg px-3 py-2.5 ring-1 transition ${
        read
          ? "bg-slate-900/50 ring-slate-800/50"
          : "bg-slate-900 ring-slate-800 hover:ring-sky-500"
      }`}
    >
      <span
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
          read ? "bg-slate-700" : "bg-sky-400"
        }`}
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm leading-snug ${
            read ? "text-slate-500" : "text-slate-100"
          }`}
        >
          {item.title}
        </span>
        <span className="mt-0.5 block text-xs text-slate-400">
          {item.source}
          {item.published ? ` · ${timeAgo(item.published)}` : ""}
        </span>
      </span>
    </a>
  );
}

export default function NewsPage() {
  const [read, setRead] = useState<Set<string> | null>(null); // null = loading (avoids SSR/localStorage mismatch)

  useEffect(() => {
    setRead(loadRead());
  }, []);

  const isRead = (id: string) => (read ? read.has(id) : false);
  const markRead = (id: string) => {
    setRead((prev) => {
      const next = new Set(prev ?? loadRead());
      next.add(id);
      localStorage.setItem(LS_KEY, JSON.stringify([...next]));
      return next;
    });
  };
  const markAllRead = () => {
    const all = items.map((i) => i.id);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
    setRead(new Set(all));
  };

  const groups = useMemo(() => {
    const today = londonDay(new Date().toISOString());
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const todayItems = items.filter((i) => londonDay(i.published) === today);
    const weekItems = items.filter(
      (i) => londonDay(i.published) !== today && i.published && new Date(i.published).getTime() >= weekAgo
    );
    const olderItems = items.filter(
      (i) => !i.published || new Date(i.published).getTime() < weekAgo
    );
    return { todayItems, weekItems, olderItems };
  }, []);

  const unreadCount = read ? items.filter((i) => !read.has(i.id)).length : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Local news</h1>
          <p className="text-xs text-slate-500">
            Google News · {items.length} articles from 24 outlets · updated{" "}
            {new Date(fetchedAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-slate-300 ring-1 ring-slate-800 transition hover:ring-sky-500"
        >
          Mark all read
          {unreadCount !== null ? ` (${unreadCount} unread)` : ""}
        </button>
      </div>

      {(["todayItems", "weekItems", "olderItems"] as const).map((key) => {
        const list = groups[key];
        if (list.length === 0) return null;
        const titles: Record<string, string> = {
          todayItems: "Today",
          weekItems: "This week",
          olderItems: "Earlier",
        };
        return (
          <section key={key}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {titles[key]} · {list.length}
            </h2>
            <div className="space-y-2">
              {list.map((item) => (
                <NewsRow
                  key={item.id}
                  item={item}
                  read={isRead(item.id)}
                  onOpen={markRead}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
