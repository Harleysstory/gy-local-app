# GY Local — Great Yarmouth personal app

Your personal "local everything" app for Great Yarmouth: places, map, live
weather, and (soon) events, bus departures, and local news. Built with
Next.js + Tailwind + Leaflet, all free tooling, £0/month.

Companion docs (in the same workspace as this project):
- `great-yarmouth-data-sources.md` — where every data source comes from
- `local-everything-next-steps.md` — the phased build plan
- `local-everything-personal-blueprint.md` — the overall design

---

## 1. One-time setup (do this first, ~10 minutes)

You need three things installed: **Node.js**, **VS Code**, and (recommended)
**Git**.

**Option A — winget (Windows 10/11 has it built in).** Open PowerShell and run:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Microsoft.VisualStudioCode
winget install Git.Git
```

**Option B — download and install manually:**
- Node.js LTS → https://nodejs.org
- VS Code → https://code.visualstudio.com
- Git → https://git-scm.com

> ⚠️ **Two gotchas you will absolutely hit (already confirmed on this machine):**
>
> 1. After installing, **close and reopen VS Code / your terminal** so the
>    `node` command is found. Verify with: `node --version`
> 2. PowerShell blocks npm by default with the error
>    *"npm.ps1 cannot be loaded because running scripts is disabled on this
>    system"*. Fix it once and for all by running this in PowerShell:
>
>    ```powershell
>    Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
>    ```
>
>    (Safe, Microsoft-recommended developer setting — your user account only.)

## 2. Open the project in VS Code

```powershell
code gy-local-app
```

(or VS Code → File → Open Folder → select `gy-local-app`)

Recommended VS Code extensions ( Extensions panel, Ctrl+Shift+X ):
- **ESLint** and **Prettier** (auto-formatting)
- **Tailwind CSS IntelliSense** (class autocomplete)

## 3. Run it

In VS Code's built-in terminal ( Ctrl+` ):

```powershell
npm install     # first time only — downloads dependencies
npm run dev     # starts the dev server
```

Open **http://localhost:3000** in your browser.

**What you should see:**
- Home: live Great Yarmouth weather (from Open-Meteo), sample places, feature roadmap cards
- `/map` (click **Map** in the header): Leaflet map of Yarmouth with pins

**Make it feel like an app on your phone:** open `http://<your-pc-ip>:3000`
on your phone (same Wi-Fi), or once deployed (§6), open the site in your
phone's browser → "Add to Home Screen". That's the PWA done — no app store.

## 4. Project structure

```
gy-local-app/
├── src/app/
│   ├── page.tsx          Home — weather + places (live already)
│   ├── map/page.tsx      Map page
│   └── layout.tsx        Header, footer, attribution
├── src/components/
│   └── MapView.tsx       Leaflet map (client-only)
├── src/lib/
│   └── places.ts         PLACEHOLDER data — swap after import (below)
├── src/data/             Output folder for the import scripts
├── scripts/
│   ├── import-overture.mjs   Filter your Overture download → places JSON
│   ├── scrape-events.mjs      Visit Great Yarmouth calendar → events JSON
│   └── filter-gtfs.mjs        BODS national GTFS → local transit JSON
├── db/schema.sql         Database schema for when you add Turso/D1 (§5)
└── package.json
```

## 5. What to build next (in this order)

Each is a 1–3 evening job once the steps below are done:

1. **Real places.** Filter your Overture download to Yarmouth:
   `node scripts/import-overture.mjs path\to\your-overture-download.geojson`
   then edit `src/lib/places.ts` to load `src/data/imported-places.json`
   (change the `import` and delete the sample array).
2. **Events.** Fill in `DATE_SELECTOR` in `scripts/scrape-events.mjs`
   (one session with the browser inspector), then wire
   `src/data/events.json` into an Events page modelled on the Home page.
3. **Database.** ✅ DONE (26 Sep 2026) — Turso is live:
   `gy-local-harleysstory.aws-eu-west-1.turso.io`, schema applied, notes &
   favourites tested end-to-end.

   Setup notes if you ever redo it:
   - Sign up at https://app.turso.tech (GitHub, free), create DB `gy-local`,
     put `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` in `.env.local`
     (git-ignored — never commit it)
   - `npm install @libsql/client` — but on **Windows ARM64** the native
     libsql binary doesn't exist; use the pure-JS web client instead:
     `import { createClient } from "@libsql/client/web"` (already done in
     `src/lib/db.ts` and `scripts/apply-schema.mjs`)
   - `node scripts/apply-schema.mjs` applies `db/schema.sql`
   - World data (places/events/news) deliberately lives in `src/data/*.json`
     — the DB is only for YOUR data (notes, favourites, saved items), so
     re-running imports can never overwrite your notes
4. **News.** ✅ DONE — `npm run import:news` fetches the Google News RSS
   feed for great_yarmouth live; read-tracking in the browser.
5. **Dashboard batch.** ✅ DONE (26 Sep 2026) — the home page is now a
   "Today in Yarmouth" dashboard:
   - Rain nowcast (Open-Meteo `minutely_15`): "rain easing around 14:20"
   - Sunrise/sunset + golden hour, with a low-tide-near-sunset beach-walk
     alert
   - Tides (Stormglass `/v2/tide/extremes/point`, free tier) — fetch cached
     6h server-side, so ≤4 of the 10 free daily requests are ever used;
     `STORMGLASS_API_KEY` lives in `.env.local`
   - Bin day helper: GYBC pattern is black/green alternate weekly — set up
     once via the card (stored in the `settings` table), then it computes
     "which bin tonight" forever
6. **Buses (DEFERRED — decided 26 Sep 2026).** The filter script and schema
   are ready (`npm run import:gtfs`); revive when you have a BODS account
   (https://data.bus-data.dft.gov.uk/, free key). Not a priority.

## 6. Putting it online (free, when you're ready)

**Easiest — Vercel (DONE, 26 Sep 2026):** the app is LIVE at
**https://gy-local-app-bradford-independent.vercel.app**
(account: harleysstory, project: gy-local-app, team: bradford-independent;
the 4 secrets are set as Vercel Production env vars)

Redeploying after local changes / data refreshes:

```powershell
npm run scrape:events   # etc. — refresh the src/data files first
vercel --prod          # uploads and rebuilds
```

Deploy notes for posterity:
- New Hobby accounts default to Vercel Authentication (SSO) on ALL urls —
  it was disabled via the API (`ssoProtection: null` on the project), which
  is why the site is public
- The deployment-specific url (gy-local-<hash>…vercel.app) stays SSO-walled
  by design (that's Vercel protecting preview-like URLs) — always share the
  production alias
- First deploy: `npm install -g vercel`, `vercel login`, `vercel link --yes`,
  `vercel env add NAME production` for each secret, `vercel deploy --prod`

Your app is live in ~2 minutes on a `*.vercel.app` URL. Push to GitHub and it
redeploys automatically. Note: for server-side state (notes, favourites)
you'll want the Turso DB from §5, since Vercel has no local disk.

**Alternative — Cloudflare** (matches the original long-term plan: Pages +
Workers + D1). Uses `@opennextjs/cloudflare`; do it when you want D1 as the
DB. Slightly more setup, same £0.

**Auth & the two sides of the app (26 Sep 2026):**
- **Client side (public):** home, map, events, news, place details, add-place
  submissions. Visitors need no account — they browse freely. They can see
  your ratings/notes (recommendations) and submit places, which wait in the
  approval queue.
- **Admin side (owner only):** `/login` → password (`ADMIN_PASSWORD` in
  `.env.local`) → sets a 30-day HttpOnly session cookie → `/admin` dashboard
  (stats, approvals, notes/favourites management, sign-out).
- Writes to YOUR data (notes, favourites, bin config, approvals) require the
  session cookie; every admin API also still accepts the `x-admin-key` header
  for scripts.
- Gotcha for local testing: the session cookie must not be `Secure` over
  http://localhost — login checks `x-forwarded-proto`, so it works locally
  and is `Secure` automatically once deployed to https (Vercel).

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| `node` / `npm` not recognized | Terminal/VS Code predates the Node install — close VS Code **completely** and reopen |
| `npm.ps1 cannot be loaded… scripts is disabled` | One-time fix: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (see §1). Workaround in the meantime: run `npm.cmd` instead of `npm` |
| `npm install` slow / fails | Retry; check proxy/antivirus isn't blocking npm |
| Map is blank | Leaflet CSS missed the build — restart `npm run dev` |
| Weather section says "unavailable" | No internet or Open-Meteo temporarily down — rest of app unaffected |
| Port 3000 busy | A production preview server may still be running — stop it with `taskkill /IM node.exe /F` — or use `npm run dev -- -p 3001` |

**Status as of 26 Sep 2026:** setup done (Node 24.19.0 installed), the
execution-policy fix applied in the Bionic session shell, dependencies
installed, production build verified green, and the app confirmed serving
with live weather and the places grid rendering.

---

**Remember the habit:** one small thing deployed each session beats a big
perfect build. Check off §5's list in order, and use
`great-yarmouth-data-sources.md` whenever a source needs details.
