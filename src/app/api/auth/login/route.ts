import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/auth";

/** POST /api/auth/login { password } → sets HttpOnly session cookie */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const password = body?.password;
  if (
    typeof password !== "string" ||
    !process.env.ADMIN_PASSWORD ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  // Only mark Secure when the connection is actually https (Vercel sets
  // x-forwarded-proto); otherwise http://localhost would never send the cookie.
  const https =
    req.headers.get("x-forwarded-proto") === "https" ||
    new URL(req.url).protocol === "https:";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: https,
  });
  return res;
}
