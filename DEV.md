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
TURSO_DATABASE_URL   libsql://<db>.turso.io
TURSO_AUTH_TOKEN     eyJ…
STORMGLASS_API_KEY   …
ADMIN_PASSWORD       …                     # the /login password
DEPLOY_HOOK_URL      https://api.vercel.com/v1/integrations/deploy/…  # Vercel only
```

Same five exist as Vercel Production env vars (`vercel env ls`).

## Architecture rules (don't break these)

1. **World data** (places/events/news) lives in `src/data/*.json`, baked at
   build; **your data** (notes/favourites/manual places/messages/settings)
   lives in Turso. Re-running imports can therefore never clobber notes.
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

## Data refreshes

- Events/news: **automatic** (see above).
- Places: **manual** — re-download Overture tiles (Explorer export, any
  bbox), then `npm run import:overture <folder(s)>`. Multi-tile merges
  dedupe by Overture ID (keeps the higher-confidence copy — notes survive).
- Bins: set once on the home page; stored in Turso `settings`.

## Database

Turso free tier — `gy-local-harleysstory.aws-eu-west-1.turso.io`
(aws-eu-west-1). CLI doesn't ship Windows binaries; manage via
app.turso.tech, query via `@libsql/client/web` scripts. There have been
**two unexplained data wipe events** (26 Sep) — cause never confirmed
(possibly dashboard experimentation). If data vanishes again, investigate
the Turso dashboard's activity log before anything else, and re-seed:
notes/favourites are the only things that need re-creating.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `node`/`npm`/`git` not recognized | Reopen terminal; or add `C:\Program Files\nodejs` + `C:\Program Files\Git\cmd` to `$env:Path` |
| `npm.ps1` blocked | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Map blank | Leaflet CSS missed the build — restart `npm run dev` |
| Weather/tides "unavailable" | Check the env vars exist at runtime; Stormglass free tier = 10 req/day (cache keeps us ≤4) |
| Port 3000 busy | `taskkill /IM node.exe /F` or `npm run dev -- -p 3001` |
| `/api/*` returns 503 "Database not configured" | `.env.local` missing/unreadable — check CRLF parser note above |
