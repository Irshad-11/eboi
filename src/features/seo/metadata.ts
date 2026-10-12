import type { Metadata } from "next";
import { SITE } from "@/config/site";

type PageMeta = {
  title: string;
  description: string;
  /** Path only, e.g. "/shop". metadataBase turns it into an absolute canonical. */
  path: string;
  /** Leave out to inherit the route's opengraph-image file. */
  images?: string[];
  noindex?: boolean;
  type?: "website" | "book" | "article";
};

/**
 * Every public page goes through this, so canonical, Open Graph and Twitter
 * tags are always present and always agree with each other.
 */
export function pageMetadata({ title, description, path, images, noindex, type = "website" }: PageMeta): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE.name,
      locale: SITE.locale,
      type: type === "book" ? "book" : type,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Plain-text excerpt for meta descriptions (Google shows ~155 characters). */
export function excerpt(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length)}…`;
}
