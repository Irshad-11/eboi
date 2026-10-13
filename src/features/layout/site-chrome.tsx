import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { getSettings, toClientSettings } from "@/features/settings/queries";
import { getCategories } from "@/features/categories/queries";
import { getCollections } from "@/features/collections/queries";
import { SiteTrackers } from "@/features/analytics/site-trackers";
import { ReaderProvider } from "@/features/preview/reader-context";
import { isSupabaseConfigured } from "@/lib/env";
import { mediaUrl } from "@/lib/media";
import { AnnouncementBar } from "./announcement-bar";
import { Header } from "./header";
import { Footer } from "./footer";
import { ShopProvider } from "./shop-context";
import { FooterLinksProvider } from "./footer-links-context";
import { getLiveOffers } from "@/features/offers/queries";
import { getPublishedBooks, getRecentSales, toLite } from "@/features/books/queries";
import { sortBooks } from "@/features/books/catalog";
import { FloatingTools, PromoPopup, RecentSalesToast } from "./site-extras";
import type { HeaderNav, NavItem } from "./nav";

/** A countdown that already ran out hides the bar (the browser re-checks every second). */
function isPast(iso: string | null): boolean {
  return iso != null && Date.parse(iso) <= Date.now();
}

/** Announcement bar, header, footer, providers and trackers for every public page. */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const [settings, categories, collections, offers] = await Promise.all([getSettings(), getCategories(), getCollections(), getLiveOffers()]);
  const f = settings.features;
  const [allBooks, recentSales] = await Promise.all([
    settings.popup_enabled && settings.popup_show_latest ? getPublishedBooks() : Promise.resolve([]),
    f.recent_sales_toast ? getRecentSales(8) : Promise.resolve([]),
  ]);
  const latest = sortBooks(allBooks, "newest").slice(0, 3).map(toLite);
  const catItems = categories.filter((c) => c.count > 0).map((c) => ({ label: c.name, url: `/category/${c.slug}`, icon: c.icon, count: c.count, pin: c.show_in_nav }));
  const colItems = collections.filter((c) => c.books.length > 0).map((c) => ({ label: c.name, url: `/collections/${c.slug}`, count: c.books.length, pin: c.show_in_nav }));
  const strip = (i: { pin: boolean } & NavItem): NavItem => ({ label: i.label, url: i.url, icon: i.icon, count: i.count });
  const nav: HeaderNav = {
    categories: catItems.map(strip),
    collections: colItems.map(strip),
    pinned: [...catItems, ...colItems].filter((i) => i.pin).map(strip),
    links: settings.header_links,
    hasOffers: offers.length > 0,
  };
  const announcementEnded = isPast(settings.announcement_ends_at);
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
          {settings.announcement_active && (settings.announcement || settings.announcement_image) && !announcementEnded && (
            <AnnouncementBar
              text={settings.announcement}
              abroadText={settings.announcement_abroad}
              code={settings.announcement_code}
              endsAt={settings.announcement_ends_at}
              link={settings.announcement_link}
              dismissible={settings.announcement_dismissible}
              bg={settings.announcement_bg}
              fg={settings.announcement_fg}
              image={mediaUrl(settings.announcement_image)}
            />
          )}
          <Header nav={nav} whatsappNumber={settings.whatsapp_number} siteName={settings.site_name} quickLinks={settings.footer_columns} />
          <main id="main">{children}</main>
          <Footer settings={settings} categories={footerCategories} />
          {settings.popup_enabled && (settings.popup_title || settings.popup_body || settings.popup_image || latest.length > 0) && (
            <PromoPopup
              version={settings.popup_version}
              title={settings.popup_title}
              body={settings.popup_body}
              image={mediaUrl(settings.popup_image)}
              buttonLabel={settings.popup_button_label}
              link={settings.popup_link}
              books={latest}
              delay={settings.popup_delay}
              autoclose={settings.popup_autoclose}
              frequency={settings.popup_frequency}
            />
          )}
          <FloatingTools whatsapp={f.floating_whatsapp} backToTop={f.back_to_top} />
          {recentSales.length > 0 && <RecentSalesToast sales={recentSales} />}
          <SiteTrackers />
          <Analytics />
        </ReaderProvider>
      </FooterLinksProvider>
    </ShopProvider>
  );
}
