import { createHash } from "node:crypto";

export const ADMIN_COOKIE = "gy_admin";
const SALT = "gy-local-v1";

/** Stable token derived from ADMIN_PASSWORD — set as an HttpOnly cookie on login. */
export function adminToken(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(`${pw}:${SALT}`).digest("hex");
}

/**
 * Admin check for API routes: accepts EITHER the session cookie (browser,
 * set by /login) or the legacy x-admin-key header (scripts/tests).
 */
export function isAdminRequest(req: Request): boolean {
  const header = req.headers.get("x-admin-key");
  if (header && process.env.ADMIN_PASSWORD && header === process.env.ADMIN_PASSWORD) {
    return true;
  }
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]*)`));
  return Boolean(m && m[1] === adminToken());
}

export function loginCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${adminToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}${secure}`;
}
