import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { getSettings, toClientSettings } from "@/features/settings/queries";
import { SiteTrackers } from "@/features/analytics/site-trackers";
import { isSupabaseConfigured } from "@/lib/env";
import { Header } from "./header";
import { Footer } from "./footer";
import { ShopProvider } from "./shop-context";

/** Header, footer, providers and trackers for every public page (and the 404). */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const announcement = settings.announcement_active && settings.announcement ? settings.announcement : null;
  return (
    <ShopProvider settings={toClientSettings(settings)}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-paper focus:p-3">
        Skip to content
      </a>
      {!isSupabaseConfigured && (
        <p className="bg-rust px-4 py-2 text-center text-small text-paper">
          Supabase is not connected yet. Fill in .env (see README) and restart the dev server.
        </p>
      )}
      <Header tagline={settings.tagline} announcement={announcement} whatsappNumber={settings.whatsapp_number} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
      <SiteTrackers />
      <Analytics />
    </ShopProvider>
  );
}
