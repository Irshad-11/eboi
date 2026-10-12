import "server-only";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Admin reads. They run as the signed-in admin through RLS, so drafts,
 * private notes and inactive offers are visible here and nowhere else.
 */

export async function adminListBooks() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("books")
    .select("id, book_code, title, slug, author, category, language, status, badge, price, total_sells, views, cover_path, preview_path, preview_page_count, is_demo, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminGetBook(id: string) {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const { data: members } = await supabase.from("collection_books").select("collection_id").eq("book_id", id);
  return { book: data, memberOf: (members ?? []).map((m) => m.collection_id) };
}

export async function adminFormOptions() {
  const supabase = await createSessionClient();
  const [cols, offers, facets] = await Promise.all([
    supabase.from("collections").select("id, name").order("sort_order").order("name"),
    supabase.from("offers").select("id, title, is_active").order("created_at", { ascending: false }),
    supabase.from("books").select("category, language"),
  ]);
  const uniq = (list: string[]) => [...new Set(list.filter(Boolean))].sort();
  return {
    collections: cols.data ?? [],
    offers: offers.data ?? [],
    categories: uniq((facets.data ?? []).map((r) => r.category)),
    languages: uniq((facets.data ?? []).map((r) => r.language)),
  };
}

export async function adminListCollections() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*, collection_books(book_id)")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(({ collection_books, ...c }) => ({ ...c, bookCount: collection_books.length }));
}

export async function adminGetCollection(id: string) {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("collections").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const { data: rows } = await supabase.from("collection_books").select("book_id, position").eq("collection_id", id).order("position");
  return { collection: data, bookIds: (rows ?? []).map((r) => r.book_id) };
}

export async function adminListOffers() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*, offer_books(book_id), offer_collections(collection_id)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(({ offer_books, offer_collections, ...o }) => ({
    ...o,
    bookIds: offer_books.map((b) => b.book_id),
    collectionIds: offer_collections.map((c) => c.collection_id),
  }));
}

export async function adminBookPicker() {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("books").select("id, title, book_code, status, price").order("title");
  return data ?? [];
}
