import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/service";
import { withPricing } from "@/features/offers/queries";
import { coverUrl } from "./cover";
import { CARD_COLUMNS, DETAIL_COLUMNS, type BookCard, type BookDetail, type BookLite } from "./types";

/**
 * The whole published catalogue as cards, newest first.
 *
 * WHY load everything: eBoi is a small shop (tens to a few hundred titles).
 * One cached query per request lets search, filters and sorting work on the
 * FINAL (offer-applied) price, which SQL alone could not see. If the
 * catalogue ever passes ~2,000 books, move filtering into a SQL view.
 */
export const getPublishedBooks = cache(async (): Promise<BookCard[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("books")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .order("release_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) {
    console.error("[books] list failed:", error.message);
    return [];
  }
  return withPricing(data ?? []);
});

export const getBookBySlug = cache(async (slug: string): Promise<BookDetail | null> => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await createPublicClient()
    .from("books")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) console.error("[books] detail failed:", error.message);
  if (!data) return null;
  const [priced] = await withPricing([data]);
  return priced ?? null;
});

/** For links shared before a slug changed: old slug -> current slug. */
export async function resolveOldBookSlug(oldSlug: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createPublicClient();
  const { data: hist } = await supabase.from("book_slug_history").select("book_id").eq("old_slug", oldSlug).maybeSingle();
  if (!hist) return null;
  const { data: book } = await supabase
    .from("books")
    .select("slug")
    .eq("id", hist.book_id)
    .eq("status", "published")
    .maybeSingle();
  return book?.slug ?? null;
}

export function toLite(b: BookCard): BookLite {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: b.author,
    book_code: b.book_code,
    coverUrl: coverUrl(b),
    pricing: b.pricing,
    rating: Number(b.rating),
    rating_count: b.rating_count,
    is_demo: b.is_demo,
  };
}

/** Visible reviews (admin-entered testimonials) for a published book. */
export const getBookReviews = cache(async (bookId: string) => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("book_reviews")
    .select("id, author_name, rating, body, review_date")
    .eq("book_id", bookId)
    .eq("is_visible", true)
    .order("sort_order")
    .order("review_date", { ascending: false });
  if (error) console.error("[reviews] read failed:", error.message);
  return data ?? [];
});

/** Recent visible reviews of published books, best first, for the home page. */
export const getTopReviews = cache(async (limit = 8) => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("book_reviews")
    .select("id, book_id, author_name, rating, body, review_date")
    .eq("is_visible", true)
    .gte("rating", 4)
    .neq("body", "")
    .order("review_date", { ascending: false })
    .limit(40);
  if (error) {
    console.error("[reviews] read failed:", error.message);
    return [];
  }
  const books = new Map((await getPublishedBooks()).map((b) => [b.id, b]));
  return (data ?? [])
    .filter((r) => books.has(r.book_id))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit)
    .map((r) => ({ ...r, book: books.get(r.book_id)! }));
});

/** Shop totals for the "in numbers" strip: real figures only. */
export async function getShopStats() {
  const books = await getPublishedBooks();
  const sold = books.reduce((n, b) => n + (b.total_sells ?? 0), 0);
  const rated = books.filter((b) => Number(b.rating) > 0 && b.rating_count > 0);
  const ratings = rated.reduce((n, b) => n + b.rating_count, 0);
  const avg = ratings ? rated.reduce((n, b) => n + Number(b.rating) * b.rating_count, 0) / ratings : 0;
  return { books: books.length, sold, ratings, avg: Math.round(avg * 10) / 10 };
}

/**
 * The latest orders from the sales log, for the optional "recent order"
 * notice: only the book and when, never the note or anything about the buyer.
 */
export const getRecentSales = cache(async (limit = 8): Promise<{ title: string; slug: string; coverUrl: string | null; at: string }[]> => {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const { data } = await createServiceClient()
      .from("sales_log")
      .select("book_id, sold_at")
      .not("book_id", "is", null)
      .gte("sold_at", new Date(Date.now() - 14 * 86400000).toISOString())
      .order("sold_at", { ascending: false })
      .limit(limit);
    const books = new Map((await getPublishedBooks()).map((b) => [b.id, b]));
    return (data ?? []).flatMap((s) => {
      const b = s.book_id ? books.get(s.book_id) : undefined;
      return b ? [{ title: b.title, slug: b.slug, coverUrl: coverUrl(b), at: s.sold_at }] : [];
    });
  } catch {
    return [];
  }
});

/** "#1 in Business": rank by copies sold within the book's category. */
export function categoryRank(book: { id: string; category: string }, all: BookCard[]): number | null {
  const same = all.filter((b) => b.category === book.category && b.total_sells > 0).sort((a, b) => b.total_sells - a.total_sells);
  const i = same.findIndex((b) => b.id === book.id);
  return i >= 0 && i < 10 && same.length > 1 ? i + 1 : null;
}

/** Related titles: same category first, then shared tags. */
export function relatedBooks(book: { id: string; category: string; tags: string[] }, all: BookCard[], limit = 4) {
  const tags = new Set(book.tags);
  const others = all.filter((b) => b.id !== book.id);
  const matched = others
    .map((b) => ({
      b,
      score: (b.category === book.category ? 3 : 0) + b.tags.filter((t) => tags.has(t)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.b.total_sells - x.b.total_sells)
    .map((x) => x.b);
  // Top up a short row with best sellers so the shelf never looks empty.
  const seen = new Set(matched.map((b) => b.id));
  const fill = [...others].sort((x, y) => y.total_sells - x.total_sells).filter((b) => !seen.has(b.id));
  return [...matched, ...fill].slice(0, limit);
}
