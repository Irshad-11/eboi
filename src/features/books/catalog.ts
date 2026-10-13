import { z } from "zod";
import type { BookCard } from "./types";

/**
 * Search, filters and sort for the shop, collection and category views.
 * Pure functions over the cached catalogue, so the page, the counts, the
 * search suggestions and analytics all agree.
 */

export const SORTS = {
  relevance: "Recommended",
  newest: "Newest",
  "best-selling": "Best selling",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Top rated",
} as const;
export type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as [SortKey, ...SortKey[]];

export const PAGE_SIZE = 24;

const list = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (v === undefined ? [] : (Array.isArray(v) ? v : [v])).flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean).slice(0, 20))
  .catch([]);

const money = z.preprocess(
  (v) => (Array.isArray(v) ? v[0] : v),
  z.coerce.number().int().min(0).max(1_000_000).optional(),
).catch(undefined);

const one = (schema: z.ZodType) => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), schema);

/** searchParams are untrusted: anything invalid is dropped, never thrown. */
export const shopParamsSchema = z.object({
  q: one(z.string().trim().max(80).optional()).catch(undefined) as z.ZodType<string | undefined>,
  category: list,
  language: list,
  format: list,
  min: money as z.ZodType<number | undefined>,
  max: money as z.ZodType<number | undefined>,
  deals: one(z.enum(["1"]).optional()).catch(undefined) as z.ZodType<"1" | undefined>,
  offer: one(z.uuid().optional()).catch(undefined) as z.ZodType<string | undefined>,
  sort: one(z.enum(SORT_KEYS).optional()).catch(undefined) as z.ZodType<SortKey | undefined>,
  page: one(z.coerce.number().int().min(1).max(50).optional()).catch(undefined) as z.ZodType<number | undefined>,
});

export type ShopParams = z.infer<typeof shopParamsSchema>;

export function parseShopParams(raw: Record<string, string | string[] | undefined>): ShopParams {
  const p = shopParamsSchema.parse(raw);
  if (!p.q) delete p.q;
  return p;
}

function normalise(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

export function searchScore(b: BookCard, q: string): number {
  const words = normalise(q).split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  const title = normalise(b.title);
  const hay = normalise([b.title, b.subtitle ?? "", b.author, b.category, b.book_code, b.language, ...b.tags].join(" "));
  if (!words.every((w) => hay.includes(w))) return 0;
  // Title matches rank first, title-starts-with highest.
  return 1 + (words.every((w) => title.includes(w)) ? 2 : 0) + (title.startsWith(words[0]!) ? 2 : 0);
}

export function matchesQuery(b: BookCard, q: string): boolean {
  return searchScore(b, q) > 0;
}

/** Category name -> slug, so filters can use readable URLs. */
export type CategorySlugMap = Map<string, string>;

export function filterBooks(books: BookCard[], p: ShopParams, catSlug: CategorySlugMap): BookCard[] {
  return books.filter(
    (b) =>
      (!p.q || matchesQuery(b, p.q)) &&
      (!p.category.length || p.category.includes(catSlug.get(b.category) ?? "")) &&
      (!p.language.length || p.language.includes(b.language)) &&
      (!p.format.length || p.format.includes(b.format)) &&
      (p.min == null || b.pricing.final >= p.min) &&
      (p.max == null || b.pricing.final <= p.max) &&
      (!p.deals || b.pricing.was != null) &&
      (!p.offer || b.pricing.offer?.id === p.offer),
  );
}

export function releaseTime(b: Pick<BookCard, "release_date" | "created_at">): number {
  return new Date(b.release_date ?? b.created_at).getTime();
}

export function sortBooks(books: BookCard[], sort: SortKey = "relevance", q?: string): BookCard[] {
  const list = [...books];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => releaseTime(b) - releaseTime(a));
    case "best-selling":
      return list.sort((a, b) => b.total_sells - a.total_sells);
    case "price-asc":
      return list.sort((a, b) => a.pricing.final - b.pricing.final);
    case "price-desc":
      return list.sort((a, b) => b.pricing.final - a.pricing.final);
    case "rating":
      return list.sort((a, b) => Number(b.rating) - Number(a.rating) || b.rating_count - a.rating_count);
    default:
      if (q) return list.sort((a, b) => searchScore(b, q) - searchScore(a, q) || b.total_sells - a.total_sells);
      // Featured first, then a blend of popularity and freshness.
      return list.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.total_sells - a.total_sells || releaseTime(b) - releaseTime(a));
  }
}

export type Facet = { value: string; label: string; count: number };

/** Facets with counts over a book set, for the filter panel. */
export function facets(books: BookCard[], catSlug: CategorySlugMap) {
  const count = (pick: (b: BookCard) => string, label?: (v: string) => string) => {
    const m = new Map<string, { label: string; count: number }>();
    for (const b of books) {
      const v = pick(b);
      if (!v) continue;
      const cur = m.get(v) ?? { label: label ? label(v) : v, count: 0 };
      cur.count++;
      m.set(v, cur);
    }
    return [...m.entries()]
      .map(([value, { label: l, count: c }]) => ({ value, label: l, count: c }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  };
  const nameBySlug = new Map([...catSlug.entries()].map(([n, s]) => [s, n]));
  const prices = books.map((b) => b.pricing.final);
  return {
    categories: count((b) => catSlug.get(b.category) ?? "", (s) => nameBySlug.get(s) ?? s),
    languages: count((b) => b.language),
    formats: count((b) => b.format),
    deals: books.filter((b) => b.pricing.was != null).length,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}

/** Serialises params back to a query string (repeated keys for lists). */
export function toQuery(p: Partial<ShopParams>): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  for (const c of p.category ?? []) sp.append("category", c);
  for (const l of p.language ?? []) sp.append("language", l);
  for (const f of p.format ?? []) sp.append("format", f);
  if (p.min != null) sp.set("min", String(p.min));
  if (p.max != null) sp.set("max", String(p.max));
  if (p.deals) sp.set("deals", "1");
  if (p.offer) sp.set("offer", p.offer);
  if (p.sort && p.sort !== "relevance") sp.set("sort", p.sort);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function shopHref(p: Partial<ShopParams> = {}, base = "/shop"): string {
  return `${base}${toQuery(p)}`;
}
