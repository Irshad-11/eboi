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
    .select("id, book_code, title, slug, author, category, language, status, badge, price, old_price, is_free, free_until, total_sells, views, cover_path, preview_path, preview_page_count, is_demo, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminGetBook(id: string) {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const [{ data: members }, { data: reviews }, { count }] = await Promise.all([
    supabase.from("collection_books").select("collection_id").eq("book_id", id),
    supabase.from("book_reviews").select("author_name, rating, body, review_date, is_visible").eq("book_id", id).order("sort_order"),
    supabase.from("sales_log").select("id", { count: "exact", head: true }).eq("book_id", id),
  ]);
  return { book: data, memberOf: (members ?? []).map((m) => m.collection_id), reviews: reviews ?? [], loggedSales: count ?? 0 };
}

export async function adminFormOptions() {
  const supabase = await createSessionClient();
  const [cols, offers, facets, cats, settings] = await Promise.all([
    supabase.from("collections").select("id, name").order("sort_order").order("name"),
    supabase.from("offers").select("id, title, is_active").order("created_at", { ascending: false }),
    supabase.from("books").select("category, language"),
    supabase.from("categories").select("name").order("sort_order"),
    supabase.from("site_settings").select("title_template").eq("id", 1).maybeSingle(),
  ]);
  const uniq = (list: string[]) => [...new Set(list.filter(Boolean))];
  return {
    collections: cols.data ?? [],
    offers: offers.data ?? [],
    categories: uniq([...(cats.data ?? []).map((c) => c.name), ...(facets.data ?? []).map((r) => r.category)]),
    languages: uniq((facets.data ?? []).map((r) => r.language)).sort(),
    titleTemplate: settings.data?.title_template || "%s | eBoi",
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

export async function adminListCategories() {
  const supabase = await createSessionClient();
  const [{ data, error }, { data: books }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("books").select("category"),
  ]);
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>();
  for (const b of books ?? []) counts.set(b.category, (counts.get(b.category) ?? 0) + 1);
  return (data ?? []).map((c) => ({ ...c, bookCount: counts.get(c.name) ?? 0 }));
}

export async function adminListBanners() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("banners").select("*").order("sort_order").order("created_at");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminPageSeo() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("page_seo").select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminListRedirects() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("redirects").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
