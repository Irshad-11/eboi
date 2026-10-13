/**
 * Brand and site-wide constants. Everything the shop owner edits day to day
 * (tagline, WhatsApp, templates, SEO) lives in the site_settings table.
 */
export const SITE = {
  name: "eBoi",
  /** Spellings people type into Google. Fed to WebSite/Organization JSON-LD. */
  alternateNames: ["eboi", "E+BOI", "eBoi PDF", "eBoi books", "eboi pdf"],
  defaultTagline: "PDF only. Premium feel.",
  locale: "en_BD",
  language: "en",
  /** Day boundaries in analytics and countdowns use the shop's local time. */
  timezone: "Asia/Dhaka",
  currencyCode: "BDT",
  defaultCurrencySymbol: "৳",
  defaultSiteUrl: "https://eboi-pdf.vercel.app",
} as const;

/** Slugs of computed collections. They are not rows in the database. */
export const AUTO_COLLECTIONS = {
  "best-selling": { name: "Best selling", description: "" },
  latest: { name: "New arrivals", description: "" },
  "most-viewed": { name: "Most viewed", description: "" },
} as const;

export type AutoCollectionSlug = keyof typeof AUTO_COLLECTIONS;

export const AUTO_COLLECTION_SLUGS = Object.keys(AUTO_COLLECTIONS) as AutoCollectionSlug[];

export function isAutoCollectionSlug(slug: string): slug is AutoCollectionSlug {
  return slug in AUTO_COLLECTIONS;
}

/** Home page limits. */
export const HOME = {
  maxOffers: 4,
  rowCount: 12,
  collectionRowCount: 12,
  categoryCount: 12,
  faqCount: 5,
} as const;

/** Revalidation window for public pages (seconds). Admin saves also purge. */
export const PUBLIC_REVALIDATE_SECONDS = 300;
