import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * The single source of truth for "is this request from the admin?".
 * getUser() validates the session with Supabase Auth (getSession() would
 * only trust the cookie), then admin_users decides. RLS repeats the same
 * check in the database, so a bug here still cannot leak or change data.
 */
export const getAdminUser = cache(async () => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: row } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return row ? { id: user.id, email: user.email ?? "" } : null;
});

/** For admin pages: bounce to the login screen. */
export async function requireAdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** For server actions and route handlers: throw instead of redirecting. */
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) throw new Error("Not signed in as admin.");
  return user;
}
