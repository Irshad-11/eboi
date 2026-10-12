import { SITE } from "@/config/site";
import { absoluteUrl } from "@/lib/env";
import { coverUrl } from "@/features/books/cover";
import type { BookDetail } from "@/features/books/types";
import type { FaqItem, SiteSettings } from "@/features/settings/schema";

/**
 * Structured data. Written by hand (no library) because the shapes are few
 * and Google's requirements for each are specific.
 */

type Json = Record<string, unknown>;

export function JsonLd({ data }: { data: Json | Json[] }) {
  // Escape "<" so a title like "</script>" can never break out of the tag.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationJsonLd(settings: SiteSettings): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE.name,
    alternateName: SITE.alternateNames,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/apple-icon.png"),
    description: SITE.description,
    slogan: settings.tagline,
    ...(settings.social_links.length ? { sameAs: settings.social_links.map((s) => s.url) } : {}),
    ...(settings.whatsapp_number
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            telephone: `+${settings.whatsapp_number}`,
            availableLanguage: ["English", "Bengali"],
          },
        }
      : {}),
  };
}

/** WebSite + SearchAction: lets Google show a search box for "eboi". */
export function websiteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE.name,
    alternateName: SITE.alternateNames,
    url: absoluteUrl("/"),
    inLanguage: SITE.language,
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/shop")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function bookJsonLd(book: BookDetail): Json {
  const url = absoluteUrl(`/books/${book.slug}`);
  const cover = coverUrl(book);
  return {
    "@context": "https://schema.org",
    // A PDF book is both a Book (what it is) and a Product (what is sold).
    "@type": ["Book", "Product"],
    "@id": `${url}#book`,
    name: book.title,
    ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
    url,
    sku: book.book_code,
    ...(cover ? { image: absoluteUrl(cover) } : {}),
    description: book.seo_description || book.description.slice(0, 500),
    ...(book.author ? { author: { "@type": "Person", name: book.author } } : {}),
    bookFormat: "https://schema.org/EBook",
    inLanguage: book.language,
    genre: book.category,
    ...(book.page_count ? { numberOfPages: book.page_count } : {}),
    ...(book.release_date ? { datePublished: book.release_date } : {}),
    ...(book.tags.length ? { keywords: book.tags.join(", ") } : {}),
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url,
      price: book.pricing.final.toFixed(2),
      priceCurrency: SITE.currencyCode,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      ...(book.pricing.offer?.end_at ? { priceValidUntil: book.pricing.offer.end_at.slice(0, 10) } : {}),
      seller: { "@id": absoluteUrl("/#organization") },
    },
    // Only emit ratings that exist. Google penalises invented review markup.
    ...(book.rating_count > 0 && book.rating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(book.rating).toFixed(1),
            ratingCount: book.rating_count,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function faqJsonLd(items: FaqItem[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function itemListJsonLd(name: string, path: string, books: { slug: string; title: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(path),
    itemListElement: books.slice(0, 50).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/books/${b.slug}`),
      name: b.title,
    })),
  };
}
