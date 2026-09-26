"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Wrong password — check ADMIN_PASSWORD in .env.local");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-20">
      <div className="rounded-2xl bg-slate-900 p-8 ring-1 ring-slate-800 shadow-xl shadow-sky-500/5">
        <p className="text-xs uppercase tracking-widest text-sky-400">
          GY Local · Owner entrance
        </p>
        <h1 className="mt-1 text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">
          The admin side of the app is just for you. Visitors browse freely —
          they never need an account.
        </p>

        <div className="mt-6 space-y-3">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            type="password"
            placeholder="Admin password"
            autoFocus
            className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm ring-1 ring-slate-700 placeholder:text-slate-600 focus:outline-none focus:ring-sky-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={submit}
            disabled={busy || !password}
            className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>

        <div className="mt-5 flex justify-between text-xs">
          <Link href="/" className="text-slate-500 hover:text-slate-300">
            ← Back to the app
          </Link>
          <a
            href="https://www.bradfordindependent.com"
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 hover:text-amber-300"
          >
            by Bradford Independent ↗
          </a>
        </div>
      </div>
    </div>
  );
}
