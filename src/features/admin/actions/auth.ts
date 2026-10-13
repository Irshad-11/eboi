"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; email: string };

const loginSchema = z.object({
  email: z.email({ message: "Enter a valid email address." }),
  password: z.string().min(1, "Enter your password."),
});

/**
 * Signs in on the server with @supabase/ssr, so the session cookie is set on
 * the same response the server reads next (the old browser-side sign-in
 * could leave the server without the session). Then checks admin_users and
 * explains exactly what is wrong instead of silently reloading the page.
 */
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isSupabaseConfigured) {
    return { email, error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart." };
  }
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { email, error: parsed.error.issues[0]?.message ?? "Check the form." };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    const code = error?.code ?? "";
    if (code === "email_not_confirmed") {
      return { email, error: "This email is not confirmed. In Supabase go to Authentication > Users, open the user and confirm it (or create it again with Auto Confirm User)." };
    }
    if (code === "invalid_credentials" || error?.status === 400) {
      return { email, error: "Wrong email or password." };
    }
    return { email, error: `Sign-in failed: ${error?.message ?? "unknown error"}` };
  }

  const { data: admin, error: adminError } = await supabase.from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (adminError) {
    await supabase.auth.signOut();
    return { email, error: `Could not check admin access: ${adminError.message}. Did you run supabase/schema.sql?` };
  }
  if (!admin) {
    await supabase.auth.signOut();
    return {
      email,
      error: `Password correct, but ${data.user.email} is not an admin yet. In Supabase SQL Editor run: insert into public.admin_users (user_id) select id from auth.users where email = '${data.user.email}';`,
    };
  }
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
