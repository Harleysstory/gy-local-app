"use client";

import { useEffect, useState } from "react";
import { getBins } from "@/lib/localStore";

const LS_KEY = "gy-push-endpoint";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "checking" | "unsupported" | "denied" | "off" | "on" | "busy";

/**
 * 🔔 Town alerts — free web push, no accounts. One morning brief:
 * weather, tides, what's on, and (if you've set it) the bin day.
 */
export default function AlertsCard() {
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState("");
  const [isIOSHint, setIsIOSHint] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  /** Send one test notification to this device's own subscription */
  const sendTest = async () => {
    setTestMsg("Sending test…");
    try {
      const endpoint = localStorage.getItem(LS_KEY);
      if (!endpoint) throw new Error("no saved subscription — toggle alerts off and on");
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error ?? `test failed (${res.status})`);
      setTestMsg("✓ Test sent — check your notifications (can take a few seconds)");
    } catch (e) {
      setTestMsg(e instanceof Error ? e.message : "Test failed.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const ua = navigator.userAgent;
        const iOS = /iphone|ipad|ipod/i.test(ua);
        const standalone =
          window.matchMedia?.("(display-mode: standalone)").matches ||
          (navigator as unknown as { standalone?: boolean }).standalone === true;
        if (iOS && !standalone) setIsIOSHint(true);

        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          setState("unsupported");
          return;
        }
        if (typeof Notification !== "undefined" && Notification.permission === "denied") {
          setState("denied");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        const savedEndpoint = localStorage.getItem(LS_KEY);
        if (existing && savedEndpoint === existing.endpoint) setState("on");
        else if (existing && !savedEndpoint) {
          // subscribed but flag lost — re-save quietly
          localStorage.setItem(LS_KEY, existing.endpoint);
          setState("on");
        } else setState("off");
      } catch {
        setState("off");
      }
    })();
  }, []);

  const subscribe = async () => {
    setError("");
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ) as unknown as BufferSource,
        }));

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), bin: getBins() }),
      });
      if (!res.ok) throw new Error(`subscribe failed (${res.status})`);

      localStorage.setItem(LS_KEY, sub.endpoint);
      setState("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable alerts.");
      setState("off");
    }
  };

  const unsubscribe = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      localStorage.removeItem(LS_KEY);
      setState("off");
    } catch {
      setState("off");
    }
  };

  return (
    <div>
      <p className="mt-2 text-sm text-slate-300">
        One friendly morning brief — weather, tides, what&apos;s on, and your bin
        day. Free, no account, opt out anytime.
      </p>
      {state === "checking" && (
        <p className="mt-2 text-xs text-slate-500">…</p>
      )}
      {state === "unsupported" && (
        <>
          <p className="mt-2 text-xs text-slate-500">
            This browser can&apos;t do push notifications — the rest of the app
            works fine.
          </p>
          {isIOSHint && (
            <p className="mt-2 text-[11px] text-slate-500">
              On iPhone/iPad: tap <b>Share → Add to Home Screen</b>, then open
              the app from your home screen — Apple only allows notifications
              from the home-screen app, and this unlocks them.
            </p>
          )}
        </>
      )}
      {state === "denied" && (
        <p className="mt-2 text-xs text-amber-400">
          Notifications are blocked in your browser settings — unblock for this
          site, then tap enable again.
        </p>
      )}
      {(state === "off" || state === "busy") && (
        <>
          <button
            onClick={subscribe}
            disabled={state === "busy"}
            className="mt-3 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
          >
            {state === "busy" ? "Enabling…" : "🔔 Get town alerts"}
          </button>
          {isIOSHint && (
            <p className="mt-2 text-[11px] text-slate-500">
              On iPhone/iPad: tap <b>Share → Add to Home Screen</b> first, then
              open it from your home screen to enable alerts.
            </p>
          )}
        </>
      )}
      {state === "on" && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
              ✓ Alerts on — brief arrives ~7:30am
            </span>
            <button
              onClick={unsubscribe}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              turn off
            </button>
          </div>
          <button
            onClick={sendTest}
            className="text-xs text-sky-400 underline hover:text-sky-300"
          >
            Send a test notification to this device
          </button>
        </div>
      )}
      {testMsg && <p className="mt-2 text-xs text-slate-400">{testMsg}</p>}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
