import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { slugify } from "@/lib/slug";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublishedBooks } from "@/features/books/queries";

export type CategoryItem = {
  id: string | null;
  name: string;
  slug: string;
  icon: string;
  image_path: string | null;
  sort_order: number;
  show_in_nav: boolean;
  show_on_home: boolean;
  count: number;
};

/**
 * Categories from the admin list, with live book counts. A category typed on
 * a book but missing from the list still appears (at the end), so no book is
 * ever unreachable.
 */
export const getCategories = cache(async (): Promise<CategoryItem[]> => {
  const books = await getPublishedBooks();
  const counts = new Map<string, number>();
  for (const b of books) counts.set(b.category, (counts.get(b.category) ?? 0) + 1);

  let rows: Omit<CategoryItem, "count">[] = [];
  if (isSupabaseConfigured) {
    const { data, error } = await createPublicClient()
      .from("categories")
      .select("id, name, slug, icon, image_path, sort_order, show_in_nav, show_on_home")
      .order("sort_order")
      .order("name");
    if (error) console.error("[categories] read failed:", error.message);
    rows = data ?? [];
  }
  const known = new Set(rows.map((r) => r.name));
  const extra = [...counts.keys()]
    .filter((name) => !known.has(name))
    .sort()
    .map((name, i) => ({
      id: null,
      name,
      slug: slugify(name, `category-${i + 1}`),
      icon: "book",
      image_path: null,
      sort_order: 1000 + i,
      show_in_nav: false,
      show_on_home: true,
    }));
  return [...rows, ...extra].map((c) => ({ ...c, count: counts.get(c.name) ?? 0 }));
});

/** Category name -> slug, used by catalogue filters and links. */
export async function getCategorySlugMap(): Promise<Map<string, string>> {
  return new Map((await getCategories()).map((c) => [c.name, c.slug]));
}
