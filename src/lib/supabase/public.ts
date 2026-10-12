import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Read-only client for public pages. It uses the anon key and no cookies, so
 * RLS shows only published content and pages can be statically cached.
 */
export function createPublicClient() {
  return createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
