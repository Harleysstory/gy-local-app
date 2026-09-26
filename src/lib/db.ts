import { createClient } from "@libsql/client/web";

/**
 * Turso/libSQL client — the /web entry is pure JS (no native binaries),
 * which matters because libsql doesn't publish Windows ARM64 builds.
 *
 * Lazy: only connects when first used, and returns null (never throws at
 * import time) when credentials aren't configured, so the app still builds
 * and serves read-only data without a database.
 */
export type DbClient = ReturnType<typeof createClient>;

let cached: DbClient | null = null;
let tried = false;

export function getDb(): DbClient | null {
  if (cached) return cached;
  if (tried) return null;
  tried = true;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.warn(
      "[db] TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not set — user data (notes, favourites) disabled."
    );
    return null;
  }
  cached = createClient({ url, authToken });
  return cached;
}
