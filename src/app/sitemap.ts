import type { MetadataRoute } from "next";
import { AUTO_COLLECTION_SLUGS } from "@/config/site";
import { absoluteUrl } from "@/lib/env";
import { getPublishedBooks } from "@/features/books/queries";
import { getCollections } from "@/features/collections/queries";
import { coverUrl } from "@/features/books/cover";

export const revalidate = 3600;

/** Every published book and collection, with cover images for Google Images. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, collections] = await Promise.all([getPublishedBooks(), getCollections()]);
  const newest = books.reduce((max, b) => (b.updated_at > max ? b.updated_at : max), "1970-01-01");
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: books.length ? newest : now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), lastModified: books.length ? newest : now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/how-to-buy"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/faq"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const auto = AUTO_COLLECTION_SLUGS.map((slug) => ({
    url: absoluteUrl(`/collections/${slug}`),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const custom = collections
    .filter((c) => c.books.length > 0)
    .map((c) => ({ url: absoluteUrl(`/collections/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 }));

  const bookEntries = books.map((b) => {
    const cover = coverUrl(b);
    return {
      url: absoluteUrl(`/books/${b.slug}`),
      lastModified: b.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(cover ? { images: [absoluteUrl(cover)] } : {}),
    };
  });

  return [...pages, ...auto, ...custom, ...bookEntries];
}
