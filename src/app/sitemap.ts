import type { MetadataRoute } from "next";
import { AUTO_COLLECTION_SLUGS } from "@/config/site";
import { absoluteUrl } from "@/lib/env";
import type { PageKey } from "@/lib/supabase/database.types";
import { getPublishedBooks } from "@/features/books/queries";
import { coverUrl } from "@/features/books/cover";
import { getCategories } from "@/features/categories/queries";
import { getCollections } from "@/features/collections/queries";
import { getAllPageSeo } from "@/features/seo/page-seo";
import { getSettings } from "@/features/settings/queries";

export const revalidate = 3600;

/**
 * Every indexable page: fixed pages, categories, collections and published
 * books (with cover images for Google Images). Anything marked "hide from
 * search engines" in the admin is left out; with the site-wide switch on,
 * the sitemap is empty.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, books, collections, categories, pageSeo] = await Promise.all([getSettings(), getPublishedBooks(), getCollections(), getCategories(), getAllPageSeo()]);
  if (settings.site_noindex) return [];

  const indexed = books.filter((b) => !b.noindex);
  const newest = indexed.reduce((max, b) => (b.updated_at > max ? b.updated_at : max), "1970-01-01");
  const fresh = indexed.length ? newest : new Date();
  const hidden = (key: PageKey) => Boolean(pageSeo[key]?.noindex);

  const fixed: { key: PageKey; path: string; freq: "daily" | "monthly" | "yearly"; priority: number; lastModified?: string | Date }[] = [
    { key: "home", path: "/", freq: "daily", priority: 1, lastModified: fresh },
    { key: "shop", path: "/shop", freq: "daily", priority: 0.9, lastModified: fresh },
    { key: "how-to-order", path: "/how-to-order", freq: "monthly", priority: 0.5 },
    { key: "about", path: "/about", freq: "monthly", priority: 0.4 },
    { key: "faq", path: "/faq", freq: "monthly", priority: 0.4 },
    { key: "terms", path: "/terms", freq: "yearly", priority: 0.2 },
  ];
  const pages: MetadataRoute.Sitemap = fixed
    .filter((p) => !hidden(p.key))
    .map((p) => ({ url: absoluteUrl(p.path), changeFrequency: p.freq, priority: p.priority, ...(p.lastModified ? { lastModified: p.lastModified } : {}) }));

  const cats = categories
    .filter((c) => c.count > 0)
    .map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 }));

  const auto = AUTO_COLLECTION_SLUGS.map((slug) => ({ url: absoluteUrl(`/collections/${slug}`), changeFrequency: "daily" as const, priority: 0.6 }));

  const custom = collections
    .filter((c) => c.books.length > 0 && !c.noindex)
    .map((c) => ({ url: absoluteUrl(`/collections/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 }));

  const bookEntries = indexed.map((b) => {
    const cover = coverUrl(b);
    return {
      url: absoluteUrl(`/books/${b.slug}`),
      lastModified: b.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(cover ? { images: [absoluteUrl(cover)] } : {}),
    };
  });

  return [...pages, ...cats, ...auto, ...custom, ...bookEntries];
}
