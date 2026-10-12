/**
 * Brand and site-wide constants. Values that the shop owner edits day to day
 * (tagline, WhatsApp number, templates) live in the `site_settings` table
 * instead; these are the fixed defaults and identity.
 */
export const SITE = {
  name: "eBoi",
  /** Spellings people type into Google. Fed to WebSite/Organization JSON-LD. */
  alternateNames: ["eboi", "E+BOI", "eBoi PDF", "eBoi books"],
  defaultTagline: "PDF only. Premium feel.",
  description:
    "eBoi is a small PDF bookshop. Read the first pages free, then buy with one WhatsApp message. The PDF arrives in the same chat.",
  locale: "en_BD",
  language: "en",
  /** Day boundaries in analytics and countdowns use the shop's local time. */
  timezone: "Asia/Dhaka",
  currencyCode: "BDT",
  defaultCurrencySymbol: "৳",
  defaultSiteUrl: "https://eboi.vercel.app",
} as const;

/** Slugs of computed collections. They are not rows in the database. */
export const AUTO_COLLECTIONS = {
  "best-selling": {
    name: "Best selling",
    description: "The PDFs people actually buy, counted from real orders.",
  },
  latest: {
    name: "Latest",
    description: "Newest releases first. If it arrived this month, it is here.",
  },
  "most-viewed": {
    name: "Most viewed",
    description: "The pages readers keep opening. Popular is not the same as best, but it is a good hint.",
  },
} as const;

export type AutoCollectionSlug = keyof typeof AUTO_COLLECTIONS;

export const AUTO_COLLECTION_SLUGS = Object.keys(AUTO_COLLECTIONS) as AutoCollectionSlug[];

export function isAutoCollectionSlug(slug: string): slug is AutoCollectionSlug {
  return slug in AUTO_COLLECTIONS;
}

/** Home page limits. Kept here so design tweaks do not hunt through JSX. */
export const HOME = {
  maxOffers: 4,
  bestSellingCount: 6,
  latestCount: 8,
  collectionPreviewCount: 6,
} as const;

/** Revalidation window for public pages (seconds). Admin saves also purge. */
export const PUBLIC_REVALIDATE_SECONDS = 300;
