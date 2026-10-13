import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
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
