import { SITE } from "@/config/site";

/**
 * Public environment. NEXT_PUBLIC_* values must be read with literal
 * `process.env.NAME` expressions so Next.js can inline them in the browser
 * bundle; that is why there is no loop here.
 */
/** Placeholder domains from older .env examples; they are never the real site. */
const PLACEHOLDER_HOSTS = ["eboi.vercel.app", "your-project-ref.supabase.co"];

function resolveSiteUrl(): string {
  const strip = (u: string) => u.trim().replace(/\/+$/, "");
  const fromEnv = strip(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (fromEnv && !PLACEHOLDER_HOSTS.some((h) => fromEnv.replace(/^https?:\/\//, "") === h)) return fromEnv;
  // Vercel exposes the production domain to the browser bundle automatically.
  const vercel = strip(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? "");
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  return SITE.defaultSiteUrl;
}

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: resolveSiteUrl(),
  gscVerification: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
};

export const isSupabaseConfigured = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);

/** Absolute URL on this site, for canonical tags, JSON-LD and WhatsApp messages. */
export function absoluteUrl(path = "/"): string {
  return `${publicEnv.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
