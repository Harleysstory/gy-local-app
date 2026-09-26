import { ADMIN_COOKIE, adminToken } from "@/lib/auth";

/** GET /api/auth/session → { authed } — is this the owner, logged in? */
export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]*)`));
  return Response.json({ authed: Boolean(m && m[1] === adminToken()) });
}
