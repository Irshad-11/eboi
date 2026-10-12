"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Browser client, used only inside the admin panel: sign-in and direct file
 * uploads to private storage. Uploading from the browser avoids Vercel's
 * request body limit for server functions.
 */
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserClient() {
  client ??= createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  return client;
}
