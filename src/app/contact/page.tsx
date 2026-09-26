"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const EMAIL = "harley@bradfordindependent.com";

const KINDS = [
  { value: "enquiry", label: "❓ General enquiry" },
  { value: "report", label: "🐞 Report a problem" },
  { value: "suggestion", label: "💡 Suggestion" },
  { value: "other", label: "✍️ Something else" },
];

type Form = { kind: string; name: string; email: string; body: string; honeypot: string };

export default function ContactPage() {
  const [form, setForm] = useState<Form>({
    kind: "enquiry",
    name: "",
    email: "",
    body: "",
    honeypot: "",
  });
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Prefill from query params: ?type=report&place=<name> (from place pages)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("type");
    if (t && KINDS.some((k) => k.value === t)) setForm((f) => ({ ...f, kind: t }));
    const pl = p.get("place");
    if (pl) setPlaceName(pl);
  }, []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    if (form.body.trim().length < 2) {
      setError("Please write a message first.");
      return;
    }
    setSending(true);
    try {
      // Save a copy so nothing is ever lost (visible in the admin dashboard)
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, body: placeName ? `About "${placeName}": ${form.body}` : form.body }),
      });

      // Open their mail app, prefilled — the direct route to Harley
      const subject = `[GY Local] ${KINDS.find((k) => k.value === form.kind)?.label.replace(/^\S+\s/, "") ?? "message"}${placeName ? ` — ${placeName}` : ""}`;
      const mailBody =
        `Name: ${form.name || "-"}\nEmail: ${form.email || "-"}\nType: ${form.kind}\n${placeName ? `About: ${placeName}\n` : ""}\n${form.body}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;
      setSent(true);
    } catch {
      setError("Could not send — email harley@bradfordindependent.com directly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Get in touch</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enquiries, reports (wrong info on a place?), suggestions — anything.
          It goes to{" "}
          <a href={`mailto:${EMAIL}`} className="text-sky-400 hover:text-sky-300">
            {EMAIL}
          </a>
          , and a copy is kept so nothing gets lost.
        </p>
      </div>

      {sent ? (
        <div className="space-y-4 rounded-2xl bg-slate-900 p-6 text-center ring-1 ring-slate-800">
          <div className="text-4xl">✉️</div>
          <h2 className="text-lg font-bold">On its way</h2>
          <p className="text-sm text-slate-400">
            Your email app should have opened with the message. If it
            didn&apos;t, just email{" "}
            <a href={`mailto:${EMAIL}`} className="text-sky-400">
              {EMAIL}
            </a>{" "}
            directly.
          </p>
          <button
            onClick={() => {
              setSent(false);
              setForm((f) => ({ ...f, body: "", name: "", email: "" }));
            }}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-700 hover:ring-sky-500"
          >
            Send another
          </button>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
          {placeName && (
            <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300 ring-1 ring-amber-500/30">
              Reporting about: <b>{placeName}</b>
            </div>
          )}

          <select
            value={form.kind}
            onChange={set("kind")}
            className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm ring-1 ring-slate-700 focus:outline-none focus:ring-sky-500"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="Your name (optional)"
              className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm ring-1 ring-slate-700 placeholder:text-slate-600 focus:outline-none focus:ring-sky-500"
            />
            <input
              value={form.email}
              onChange={set("email")}
              type="email"
              placeholder="Your email (for replies)"
              className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm ring-1 ring-slate-700 placeholder:text-slate-600 focus:outline-none focus:ring-sky-500"
            />
          </div>

          <textarea
            value={form.body}
            onChange={set("body")}
            rows={5}
            placeholder="What's on your mind?"
            className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm ring-1 ring-slate-700 placeholder:text-slate-600 focus:outline-none focus:ring-sky-500"
          />

          {/* Honeypot — invisible to humans, catches bots */}
          <input
            value={form.honeypot}
            onChange={set("honeypot")}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            style={{ position: "absolute", left: "-9999px" }}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={submit}
            disabled={sending}
            className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40"
          >
            {sending ? "Opening your mail app…" : "Send message"}
          </button>
          <p className="text-center text-[11px] text-slate-500">
            Opens your email app, addressed to {EMAIL} — with a saved copy for
            backup.
          </p>
        </div>
      )}

      <Link href="/" className="block text-center text-sm text-sky-400 hover:text-sky-300">
        ← Back to the app
      </Link>
    </div>
  );
}
