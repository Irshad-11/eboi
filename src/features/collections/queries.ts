import "server-only";
import { cache } from "react";
import { AUTO_COLLECTIONS, type AutoCollectionSlug } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { CollectionRow } from "@/lib/supabase/database.types";
import { getPublishedBooks } from "@/features/books/queries";
import { releaseTime } from "@/features/books/catalog";
import type { BookCard } from "@/features/books/types";

export type CollectionWithBooks = Omit<CollectionRow, "created_at" | "updated_at"> & { books: BookCard[] };

/** All custom collections with their published books in manual order. */
export const getCollections = cache(async (): Promise<CollectionWithBooks[]> => {
  if (!isSupabaseConfigured) return [];
  const [{ data, error }, books] = await Promise.all([
    createPublicClient()
      .from("collections")
      .select(
        "id, name, slug, description, editorial_intro, mood, sort_order, show_on_home, is_demo, image_path, show_in_nav, seo_title, seo_description, focus_keyword, seo_keywords, canonical_url, noindex, og_image_path, collection_books(book_id, position)",
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    getPublishedBooks(),
  ]);
  if (error) {
    console.error("[collections] list failed:", error.message);
    return [];
  }
  const byId = new Map(books.map((b) => [b.id, b]));
  return (data ?? []).map(({ collection_books, ...c }) => ({
    ...c,
    books: [...collection_books]
      .sort((a, b) => a.position - b.position)
      .map((r) => byId.get(r.book_id))
      .filter((b): b is BookCard => Boolean(b)),
  }));
});

export async function getCollectionBySlug(slug: string): Promise<CollectionWithBooks | null> {
  const all = await getCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function resolveOldCollectionSlug(oldSlug: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createPublicClient();
  const { data: hist } = await supabase
    .from("collection_slug_history")
    .select("collection_id")
    .eq("old_slug", oldSlug)
    .maybeSingle();
  if (!hist) return null;
  const { data } = await supabase.from("collections").select("slug").eq("id", hist.collection_id).maybeSingle();
  return data?.slug ?? null;
}

/** Computed collections. They use the public display counters on purpose. */
export function autoCollectionBooks(slug: AutoCollectionSlug, books: BookCard[]): BookCard[] {
  const list = [...books];
  switch (slug) {
    case "best-selling":
      return list.filter((b) => b.total_sells > 0).sort((a, b) => b.total_sells - a.total_sells);
    case "most-viewed":
      return list.filter((b) => b.views > 0).sort((a, b) => b.views - a.views);
    case "latest":
      return list.sort((a, b) => releaseTime(b) - releaseTime(a));
  }
}

export function autoCollectionMeta(slug: AutoCollectionSlug) {
  return { slug, ...AUTO_COLLECTIONS[slug] };
}
