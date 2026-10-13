import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { getSettings, toClientSettings } from "@/features/settings/queries";
import { getCategories } from "@/features/categories/queries";
import { getCollections } from "@/features/collections/queries";
import { SiteTrackers } from "@/features/analytics/site-trackers";
import { ReaderProvider } from "@/features/preview/reader-context";
import { isSupabaseConfigured } from "@/lib/env";
import { AnnouncementBar } from "./announcement-bar";
import { Header } from "./header";
import { Footer } from "./footer";
import { ShopProvider } from "./shop-context";
import { FooterLinksProvider } from "./footer-links-context";
import type { HeaderNav } from "./nav";

/** Announcement bar, header, footer, providers and trackers for every public page. */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const [settings, categories, collections] = await Promise.all([getSettings(), getCategories(), getCollections()]);
  const nav: HeaderNav = {
    categories: categories
      .filter((c) => c.show_in_nav && c.count > 0)
      .map((c) => ({ label: c.name, url: `/category/${c.slug}`, icon: c.icon })),
    collections: collections
      .filter((c) => c.show_in_nav && c.books.length > 0)
      .map((c) => ({ label: c.name, url: `/collections/${c.slug}` })),
    links: settings.header_links,
  };
  const footerCategories = categories.filter((c) => c.count > 0).map((c) => ({ label: c.name, url: `/category/${c.slug}` }));

  return (
    <ShopProvider settings={toClientSettings(settings)}>
      <FooterLinksProvider columns={settings.footer_columns}>
        <ReaderProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:p-3 focus:shadow-md">
            Skip to content
          </a>
          {!isSupabaseConfigured && (
            <p className="bg-sale px-4 py-2 text-center text-sm text-white">Supabase is not connected. Fill in .env and restart.</p>
          )}
          {settings.announcement_active && settings.announcement && (
            <AnnouncementBar text={settings.announcement} link={settings.announcement_link} dismissible={settings.announcement_dismissible} />
          )}
          <Header nav={nav} whatsappNumber={settings.whatsapp_number} siteName={settings.site_name} />
          <main id="main">{children}</main>
          <Footer settings={settings} categories={footerCategories} />
          <SiteTrackers />
          <Analytics />
        </ReaderProvider>
      </FooterLinksProvider>
    </ShopProvider>
  );
}
