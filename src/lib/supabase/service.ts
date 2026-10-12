import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { getServiceRoleKey } from "@/lib/env.server";
import type { Database } from "./database.types";

/**
 * Service-role client. Bypasses RLS, so it is used only for narrow server
 * jobs: signing preview URLs, streaming covers, writing analytics events and
 * cleaning storage. Never pass its results to the browser unfiltered.
 */
export function createServiceClient() {
  return createClient<Database>(publicEnv.supabaseUrl, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
