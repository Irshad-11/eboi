import "server-only";
import type { Metadata } from "next";
import { SITE } from "@/config/site";
import { absoluteUrl } from "@/lib/env";
import { mediaUrl } from "@/lib/media";
import type { PageKey } from "@/lib/supabase/database.types";
import { getSettings } from "@/features/settings/queries";
import { getPageSeo } from "./page-seo";

/** SEO fields shared by books, collections and fixed pages (all admin-editable). */
export type SeoFields = {
  seo_title?: string | null;
  seo_description?: string | null;
  focus_keyword?: string | null;
  seo_keywords?: string[] | null;
  canonical_url?: string | null;
  noindex?: boolean | null;
  og_image_path?: string | null;
};

type Input = {
  /** Path of the page, e.g. "/shop". Used for the canonical URL unless overridden. */
  path: string;
  /** Fixed page key: its SEO row in the admin is applied. */
  page?: PageKey;
  /** Book or collection SEO fields. */
  item?: SeoFields | null;
  /** Used when the admin left the SEO title empty. */
  title?: string;
  description?: string;
  noindex?: boolean;
  type?: "website" | "book";
  /** Title without the site template (the home page). */
  absoluteTitle?: boolean;
};

const clean = (s: string | null | undefined) => (s ?? "").trim();

function canonicalOf(override: string | null | undefined, path: string): string {
  const c = clean(override);
  if (!c) return path;
  return /^https?:\/\//i.test(c) ? c : c.startsWith("/") ? c : `/${c}`;
}

/**
 * Every public page goes through this, so title, description, keywords,
 * canonical, robots, Open Graph and Twitter tags always agree, and every
 * value the admin set wins over the automatic one.
 */
export async function pageMetadata(input: Input): Promise<Metadata> {
  const [settings, pageRow] = await Promise.all([getSettings(), input.page ? getPageSeo(input.page) : Promise.resolve(null)]);
  const seo: SeoFields = { ...(pageRow ?? {}), ...(input.item ?? {}) };

  const isHome = input.page === "home";
  const autoTitle = isHome ? `${settings.site_name}${settings.tagline ? ` | ${settings.tagline}` : ""}` : (input.title ?? settings.site_name);
  const title = clean(seo.seo_title) || autoTitle;
  const description = clean(seo.seo_description) || clean(input.description) || settings.default_meta_description;
  const keywords = [clean(seo.focus_keyword), ...(seo.seo_keywords ?? [])].filter(Boolean);
  const canonical = canonicalOf(seo.canonical_url, input.path);
  const noindex = settings.site_noindex || Boolean(seo.noindex) || Boolean(input.noindex);
  const ogPath = seo.og_image_path || (isHome ? settings.default_og_image_path : null);
  const images = ogPath ? [absoluteUrl(mediaUrl(ogPath)!)] : undefined;
  const absolute = isHome || input.absoluteTitle;

  return {
    title: absolute ? { absolute: title } : title,
    description,
    keywords: keywords.length ? keywords : settings.default_keywords,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: settings.site_name || SITE.name,
      locale: SITE.locale,
      type: input.type === "book" ? "book" : "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}

/** Plain-text excerpt for meta descriptions (Google shows about 155 characters). */
export function excerpt(text: string, max = 155): string {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 80 ? space : cut.length)}…`;
}

/** "google-site-verification=abc" or a whole meta tag -> "abc". */
export function verificationCode(value: string | null | undefined): string | undefined {
  const v = clean(value)
    .replace(/^.*content=["']?/i, "")
    .replace(/["'].*$/, "")
    .replace(/^.*?(site-verification|msvalidate\.01)\s*[=:]\s*/i, "")
    .trim();
  return v || undefined;
}
