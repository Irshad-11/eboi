import { publicEnv } from "@/lib/env";
import { getSettings } from "@/features/settings/queries";
import { adminListRedirects, adminPageSeo } from "@/features/admin/queries";
import { PAGE_KEYS } from "@/features/seo/page-seo";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { PageSeoList, RedirectsManager, SiteSeoForm } from "@/features/admin/components/seo-settings";
import { verificationCode } from "@/features/seo/metadata";
import { IconExternal } from "@/components/icons";
import type { PageKey } from "@/lib/supabase/database.types";

export const metadata = { title: "SEO" };

const AUTO: Record<PageKey, { title: string; description?: string }> = {
  home: { title: "" },
  shop: { title: "All PDF books" },
  about: { title: "About us" },
  "how-to-order": { title: "How to order", description: "Pick a book, message us on WhatsApp, pay with bKash or Nagad and get your PDF in the same chat." },
  faq: { title: "Frequently asked questions" },
  terms: { title: "Refund policy and terms" },
};

export default async function SeoPage() {
  const [settings, rows, redirects] = await Promise.all([getSettings(), adminPageSeo(), adminListRedirects()]);
  const pages = (Object.keys(PAGE_KEYS) as PageKey[]).map((key) => ({
    key,
    label: PAGE_KEYS[key].label,
    path: PAGE_KEYS[key].path,
    autoTitle: key === "home" ? `${settings.site_name}${settings.tagline ? ` | ${settings.tagline}` : ""}` : AUTO[key].title,
    autoDescription: AUTO[key].description ?? settings.default_meta_description,
  }));
  const code = verificationCode(settings.google_verification);
  return (
    <>
      <AdminPageHead
        title="SEO"
        meta={code ? `Google verification tag is live: ${code}` : "No Google verification code set"}
        actions={
          <>
            <a href={`${publicEnv.siteUrl}/sitemap.xml`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              <IconExternal size={16} /> Sitemap
            </a>
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              <IconExternal size={16} /> Search Console
            </a>
          </>
        }
      />
      <div className="space-y-4">
        <SiteSeoForm settings={settings} />
        <PageSeoList pages={pages} rows={rows} titleTemplate={settings.title_template} />
        <RedirectsManager redirects={redirects} />
      </div>
    </>
  );
}
