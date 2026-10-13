import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

/** The signed-in Supabase user (admin or not), validated with Supabase Auth. */
export const getSessionUser = cache(async () => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
});

/**
 * The single source of truth for "is this request from the admin?".
 * RLS repeats the same check in the database (is_admin()), so a bug here
 * still cannot leak or change data.
 */
export const getAdminUser = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createSessionClient();
  const { data: row } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return row ? user : null;
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
