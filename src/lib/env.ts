import { SITE } from "@/config/site";

/**
 * Public environment. NEXT_PUBLIC_* values must be read with literal
 * `process.env.NAME` expressions so Next.js can inline them in the browser
 * bundle; that is why there is no loop here.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || SITE.defaultSiteUrl).replace(/\/+$/, ""),
  gscVerification: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
};

export const isSupabaseConfigured = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);

/** Absolute URL on this site, for canonical tags, JSON-LD and WhatsApp messages. */
export function absoluteUrl(path = "/"): string {
  return `${publicEnv.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
