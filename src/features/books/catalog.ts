import { z } from "zod";
import type { BookCard } from "./types";

/**
 * Shop search, filters and sort. Pure functions over the cached catalogue,
 * so the same logic serves the page, the result count and analytics.
 */

export const SORTS = {
  newest: "Newest",
  "best-selling": "Best selling",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
} as const;
export type SortKey = keyof typeof SORTS;

const num = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().int().min(0).max(1_000_000).optional(),
);

/** searchParams are untrusted: anything invalid is dropped, never thrown. */
export const shopParamsSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().trim().max(60).optional().catch(undefined),
  language: z.string().trim().max(40).optional().catch(undefined),
  min: num.catch(undefined),
  max: num.catch(undefined),
  sort: z.enum(Object.keys(SORTS) as [SortKey, ...SortKey[]]).optional().catch(undefined),
  offer: z.uuid().optional().catch(undefined),
});

export type ShopParams = z.infer<typeof shopParamsSchema>;

export function parseShopParams(raw: Record<string, string | string[] | undefined>): ShopParams {
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = shopParamsSchema.parse(flat);
  // Treat empty strings as "not set" so URLs stay tidy.
  for (const key of ["q", "category", "language"] as const) if (!parsed[key]) delete parsed[key];
  return parsed;
}

function normalise(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

export function matchesQuery(b: BookCard, q: string): boolean {
  const words = normalise(q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = normalise(
    [b.title, b.subtitle ?? "", b.author, b.category, b.book_code, b.language, ...b.tags].join(" "),
  );
  return words.every((w) => hay.includes(w));
}

export function filterBooks(books: BookCard[], p: ShopParams): BookCard[] {
  return books.filter(
    (b) =>
      (!p.q || matchesQuery(b, p.q)) &&
      (!p.category || b.category === p.category) &&
      (!p.language || b.language === p.language) &&
      (p.min == null || b.pricing.final >= p.min) &&
      (p.max == null || b.pricing.final <= p.max) &&
      (!p.offer || b.pricing.offer?.id === p.offer),
  );
}

export function sortBooks(books: BookCard[], sort: SortKey = "newest"): BookCard[] {
  const list = [...books];
  switch (sort) {
    case "best-selling":
      return list.sort((a, b) => b.total_sells - a.total_sells);
    case "price-asc":
      return list.sort((a, b) => a.pricing.final - b.pricing.final);
    case "price-desc":
      return list.sort((a, b) => b.pricing.final - a.pricing.final);
    default:
      return list.sort((a, b) => releaseTime(b) - releaseTime(a));
  }
}

export function releaseTime(b: Pick<BookCard, "release_date" | "created_at">): number {
  return new Date(b.release_date ?? b.created_at).getTime();
}

/** Facets with counts, for the filter panel. */
export function facets(books: BookCard[]) {
  const count = (key: "category" | "language") => {
    const m = new Map<string, number>();
    for (const b of books) m.set(b[key], (m.get(b[key]) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  const prices = books.map((b) => b.pricing.final);
  return {
    categories: count("category"),
    languages: count("language"),
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}

/** Builds a /shop URL, dropping empty values. */
export function shopHref(p: Partial<ShopParams>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  const s = sp.toString();
  return s ? `/shop?${s}` : "/shop";
}
