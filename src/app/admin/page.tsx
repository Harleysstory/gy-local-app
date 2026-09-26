import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { ADMIN_COOKIE, adminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin — GY Local" };

/**
 * Server-side gate: no valid session cookie → straight to the login page.
 * (The APIs check the same cookie themselves, so nothing admin-y is reachable
 * without logging in.)
 */
export default async function AdminPage() {
  const jar = await cookies();
  if (jar.get(ADMIN_COOKIE)?.value !== adminToken()) {
    redirect("/login");
  }
  return <AdminDashboard />;
}
