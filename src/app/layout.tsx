import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "GY Local — Great Yarmouth",
  description:
    "Personal local companion: places, events, news, tides, weather and more for Great Yarmouth.",
};

export const viewport: Viewport = {
  themeColor: "#0b1120",
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Map" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/about", label: "About" },
  { href: "/alerts", label: "🔔" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 py-3 sm:flex-row sm:justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              {/* Great Yarmouth outline mark (Harley's design) — same art as
                  the favicon & install icon */}
              <img
                src="/icon.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-xl"
              />
              <span className="text-lg font-bold tracking-tight">
                GY<span className="text-sky-400">Local</span>
              </span>
            </Link>
            <nav className="flex flex-wrap justify-center gap-1">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  title={label === "🔔" ? "Get the daily town brief" : undefined}
                  aria-label={label === "🔔" ? "Get the daily town brief" : undefined}
                  className={`rounded-lg px-2.5 py-1.5 text-xs transition hover:bg-slate-800/80 hover:text-white sm:px-3 sm:text-sm ${
                    label === "🔔" ? "text-sky-400" : "text-slate-300"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t border-slate-800 py-6 text-xs text-slate-500">
          <div className="mx-auto max-w-4xl px-4">
            <div>
              GY Local · Map data ©{" "}
              <a className="underline" href="https://www.openstreetmap.org/copyright">
                OpenStreetMap contributors
              </a>{" "}
              · Weather by{" "}
              <a className="underline" href="https://open-meteo.com/">
                Open-Meteo
              </a>{" "}
              · Tides by Stormglass
            </div>
            <div className="mt-2">
              Questions, reports or ideas?{" "}
              <Link href="/contact" className="underline hover:text-slate-300">
                Get in touch
              </Link>{" "}
              — harley@bradfordindependent.com
            </div>
            <div className="mt-2">
              Proudly sponsored by{" "}
              <a
                className="font-medium text-amber-400/90 underline decoration-amber-400/40 hover:text-amber-300"
                href="https://www.bradfordindependent.com"
                target="_blank"
                rel="noreferrer"
              >
                Bradford Independent
              </a>{" "}
              — business analysis, service design &amp; UX · Great Yarmouth
            </div>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/about"
                className="inline-block rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700 transition hover:text-white hover:ring-sky-500"
              >
                ℹ️ About
              </Link>
              <Link
                href="/contact"
                className="inline-block rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700 transition hover:text-white hover:ring-sky-500"
              >
                ✉️ Contact
              </Link>
              <Link
                href="/admin"
                className="inline-block rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700 transition hover:text-white hover:ring-sky-500"
              >
                🔑 Admin
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
