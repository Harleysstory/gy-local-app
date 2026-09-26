# DEV.md — the ops runbook

Everything the polished public README deliberately doesn't say. This is
the file to read before touching anything.

## Commands

```bash
npm run dev              # http://localhost:3000
npm run build            # NOTE: prebuild scrapes events + imports news first
npm run start            # production server locally
npm run scrape:events    # standalone scrape → src/data/events.json
npm run import:news      # standalone news fetch → src/data/news.json
npm run import:overture  # needs args: <place.geojson | folder> [more…]
node scripts/apply-schema.mjs   # apply db/schema.sql (safe to re-run)
```

## Environment (.env.local — never committed, git-ignored)

```
TURSO_DATABASE_URL            libsql://<db>.turso.io
TURSO_AUTH_TOKEN              eyJ…
STORMGLASS_API_KEY            …
ADMIN_PASSWORD                …            # the /login password
NEXT_PUBLIC_VAPID_PUBLIC_KEY  B… (87 chars) # web push public key — public by design
VAPID_PRIVATE_KEY             … (43 chars) # MUST pair with the public key — see Push section
VAPID_SUBJECT                 mailto:…    # identity that signs the pushes
```

Also as Vercel Production env vars (`vercel env ls production`), plus two
that exist ONLY there:

```
DEPLOY_HOOK_URL   https://api.vercel.com/v1/integrations/deploy/…   # NOT in .env.local
VERCEL_OIDC_TOKEN …   # the CLI appends this to .env.local itself — leave it alone,
                     # and never rewrite .env.local wholesale; append with edits
```

## Architecture rules (don't break these)

1. **Three layers of data** (changed 26 Sep 2026 to the community model):
   - **World data** (Overture places/events/news): `src/data/*.json`, baked at
     build — re-running imports can never clobber anything personal.
   - **Personal data** (notes, ratings, favourites, bin-day config): each
     visitor's browser, via `src/lib/localStore.ts`. Never sent to any server.
     No accounts — the trade-off is per-device data (a browser clear loses it).
   - **Public/shared data** (community-submitted places, contact messages,
     tides cache, refresh limiter, push subscriptions): Turso. Map
     contributions are moderated (pending → approve → public).
   The Turso `notes`/`favourites` tables are a LEGACY archive — the owner's
   one-time import button on the admin dashboard reads them; after importing,
   they can be dropped.
2. Scrapers must never break the build — on failure they keep the existing
   JSON and exit 0 (verified in `scripts/*` `main().catch`).
3. Auth = one password → HttpOnly session cookie (30 days), derived token in
   `src/lib/auth.ts`. Admin APIs accept the cookie **or** the legacy
   `x-admin-key` header (for scripts/curl).
4. `notes.place_id` has NO foreign key — places live in JSON, not the DB.
   This was a live bug once; don't reintroduce it.

## Machine-specific gotchas (Harley's laptop)

- **Windows ARM64 (Snapdragon)**: `@libsql/client` has NO native ARM64
  binary — the pure-JS `@libsql/client/web` client is used everywhere
  (`src/lib/db.ts`, scripts). Don't "upgrade" to the native import.
- **PowerShell 5.1** quirk stack: no `&&`; `npm.ps1` blocked by execution
  policy (fix: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or
  call `npm.cmd`); `curl.exe -d` strips inner quotes — use
  `Invoke-RestMethod` with a JSON string variable instead.
- Env parsers must split on `/\r?\n/` (CRLF) — the schema script hit this.
- New terminal sessions need reopening after PATH-changing installs
  (Node, Git, GitHub CLI all live in `C:\Program Files\…`).

## Deployment (Vercel)

- Account `harleysstory`, team `bradford-independent`, project `gy-local-app`
- Live: **https://gy-local-app-bradford-independent.vercel.app**
  (the deployment-specific `gy-local-<hash>-…` URLs stay SSO-walled —
  always share the production alias)
- New Hobby accounts default to SSO on ALL urls; it was disabled via
  `PATCH /v9/projects/gy-local-app {"ssoProtection":null}` — if it ever
  comes back, that's the fix.
- The login cookie is only `Secure` on https (`x-forwarded-proto`), so it
  works on http://localhost AND in production.
- Redeploy: `vercel deploy --prod --yes` (or push a GitHub commit if the
  repo is connected later).
- Transient "fetch failed" / "Not authorized" from the CLI has happened twice
  mid-deploy — **re-run the command**; the deploy itself is fine.

## Self-update pipeline (verify pieces)

cron (`vercel.json`, 06:20 UTC daily) → `/api/refresh` (6h rate-limit stored
in Turso `settings.last_refresh`) → `DEPLOY_HOOK_URL` → rebuild →
prebuild scrape. The admin dashboard has a 🔄 manual button. Created via
Vercel dashboard → Settings → Deploy Hooks (no API exists for it).

A second cron (06:30 UTC) sends the morning brief — see the Push section.
**Hobby plan caps at 2 crons and both slots are now USED**; nothing new
gets scheduled until the plan changes.

## Data refreshes

- Events/news: **automatic** (see above).
- Places: **manual** — re-download Overture tiles (Explorer export, any
  bbox), then `npm run import:overture <folder(s)>`. Multi-tile merges
  dedupe by Overture ID (keeps the higher-confidence copy — notes survive).
- Bins: set once on the home page; stored in the browser (`localStore`).
- Bin *patterns* reach Turso ONLY when a subscriber voluntarily attaches
  theirs to a push subscription (see Push section below).

## Push notifications (town alerts) — added 26 Sep 2026

Free web push, no third party: VAPID keys + `public/sw.js`.

- **Keys**: `npx web-push generate-vapid-keys`. The pair must match. To
  verify a suspect pair (e.g. after env surgery), derive the public point
  from the private scalar — Node: `createECDH("prime256v1")` →
  `setPrivateKey(<32 bytes>)` → `getPublicKey()` → base64url → compare.
- **Table**: `push_subscriptions` (endpoint, subscription JSON, voluntary
  `bin_config`) — the bin config is the ONLY copy of a person's bin pattern
  that ever leaves their device.
- **APIs**: `POST /api/push/subscribe` `{subscription, bin?}` ·
  `POST /api/push/unsubscribe` `{endpoint}` · `GET /api/push/brief`
  (`?dry=1` composes + returns title/body, sends nothing — used by both the
  admin tester and the public /alerts preview; `?force=1` bypasses the 12h
  `settings.last_brief` rate limit, admin cookie required) ·
  `POST /api/push/test` `{endpoint}` — one test to your OWN subscription
  (the “Send a test notification” link on /alerts and Home).
- **Hygiene**: 404/410 from the push service → delete the sub; any other
  error → `failure_count++`, prune at 5. A brief to 0 subscribers returns
  early and does NOT set `last_brief`.
- **THE BUG THAT BIT US (26 Sep)**: `await navigator.serviceWorker.ready`
  NEVER resolves on a browser with no service worker registered — and the
  SW is only registered by the subscribe button itself. Chicken-and-egg:
  the “Get town alerts” button never appeared for anyone, ever. Mount-time
  checks must use `navigator.serviceWorker.getRegistration()` (returns
  null instead of hanging). `ready` is still correct INSIDE `subscribe()`
  (the SW is registered first).
- **iOS**: notifications only work from the home-screen web app (16.4+).
  Safari-tab visitors see a 4-step install box instead of a button —
  Apple's rule, handled deliberately. Don't “fix” it.
- **Known rough edge**: recurring events are included in the brief every
  day; refine to weekday-matching when it starts feeling noisy.

## Env var changes — use the REST API, not CLI stdin

Piping values into `vercel env add NAME production` from PowerShell
**silently stored a wrong value once** (26 Sep). Deterministic path —
token lives at `%APPDATA%\com.vercel.cli\Data\auth.json`:

```
GET  /v9/projects/gy-local-app?teamSlug=bradford-independent   → project id
GET  /v9/projects/{id}/env?teamSlug=…                          → list + env ids
DEL  /v9/projects/{id}/env/{envId}?teamSlug=…
POST /v10/projects/{id}/env?teamSlug=…  {key, value,
                                      type: "plain"|"encrypted",
                                      target: ["production"]}
```

Gotchas learned the hard way:
- `vercel env ls` displays ENCRYPTED values as `eyJ2Ijoi…` — that's
  Vercel's encrypted-value envelope, NOT corruption. Ground truth = the
  deployed bundle (fetch the /alerts page chunks, `grep BDIkK2gg`) or a
  live dry-run.
- `NEXT_PUBLIC_*` values are inlined at BUILD time — changing them needs
  a redeploy, or the client keeps the old value.
- Each deploy costs ~1 Stormglass request (home prerender). 10/day free
  — batch env fixes before one redeploy.

## README screenshots (refreshing)

Real captures of the live app, fully scripted (no design files):

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  --headless=new --disable-gpu --hide-scrollbars `
  --force-device-scale-factor=2 --window-size=1280,800 `
  --virtual-time-budget=15000 --screenshot="<out>.png" "<live url>"
```

- `--virtual-time-budget` lets client JS settle before the shot (map
  tiles, the live brief fetch). Use 15–18s for /map and /alerts.
- Verify every capture before committing (tiles loaded, mockup
  composed, nothing half-rendered). Then downscale the @2x desktop shots
  to 1280px to keep the repo light (Pillow, LANCZOS, optimize).
- Mobile shot: `--window-size=390,844`.
- Files live in `docs/screenshots/` and the README gallery references the
  filenames — keep names stable when refreshing.

## Database

Turso free tier — `gy-local-harleysstory.aws-eu-west-1.turso.io`
(aws-eu-west-1). CLI doesn't ship Windows binaries; manage via
app.turso.tech, query via `@libsql/client/web` scripts. There have been
**two unexplained data wipe events** (26 Sep) — cause never confirmed
(possibly dashboard experimentation). If data vanishes again, investigate
the Turso dashboard's activity log before anything else, and re-seed:
notes/favourites are the only things that need re-creating.

Forensic queries (subscriptions, failure counts, `settings.last_brief`) —
scratchpad Node script: `createRequire("<project>/package.json")` →
`@libsql/client/web` → `createClient({url, authToken})` from .env.local.
No host install needed; works from any folder.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `node`/`npm`/`git` not recognized | Reopen terminal; or add `C:\Program Files\nodejs` + `C:\Program Files\Git\cmd` to `$env:Path` |
| `npm.ps1` blocked | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Map blank | Leaflet CSS missed the build — restart `npm run dev` |
| Weather/tides "unavailable" | Check the env vars exist at runtime; Stormglass free tier = 10 req/day (cache keeps us ≤4) |
| Port 3000 busy | `taskkill /IM node.exe /F` or `npm run dev -- -p 3001` |
| `/api/*` returns 503 "Database not configured" | `.env.local` missing/unreadable — check CRLF parser note above |
| Subscribe button never appears | Mount check must use `getRegistration()`, NOT `serviceWorker.ready` (hangs forever on fresh browsers — bit us 26 Sep, see Push section) |
| Subscribed but no push arrives | Check `push_subscriptions` rows + `failure_count` in Turso; admin “Send brief” reads “N of M” — if M is 0 the subscribe never landed. On iOS it must be the home-screen app, not a Safari tab |
| `vercel env ls` shows `eyJ2Ijoi…` | That's the encrypted-value envelope, NOT corruption — verify against the deployed bundle instead (see Env var section) |
| Push works from admin send but cron briefs don't | Check the crons list: `GET /v9/projects/gy-local-app?teamSlug=bradford-independent` → `crons.definitions` (should be 2, and attached to the latest deployment) |
