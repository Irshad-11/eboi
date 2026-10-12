import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { isOfferLive, priceBook, type ActiveOffer, type PriceableBook, type Pricing } from "./pricing";

/**
 * Live offers with their targets. The offers table is tiny, so time-window
 * filtering happens here rather than in a SQL expression.
 */
export const getLiveOffers = cache(async (): Promise<ActiveOffer[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("offers")
    .select(
      "id, title, banner_text, discount_type, value, applies_to, start_at, end_at, show_countdown, offer_books(book_id), offer_collections(collection_id)",
    )
    .eq("is_active", true)
    .order("start_at", { ascending: false });
  if (error) {
    console.error("[offers] read failed:", error.message);
    return [];
  }
  const now = Date.now();
  return (data ?? [])
    .filter((o) => isOfferLive(o, now))
    .map((o) => ({
      id: o.id,
      title: o.title,
      banner_text: o.banner_text,
      discount_type: o.discount_type,
      value: Number(o.value),
      applies_to: o.applies_to,
      start_at: o.start_at,
      end_at: o.end_at,
      show_countdown: o.show_countdown,
      bookIds: o.offer_books.map((r) => r.book_id),
      collectionIds: o.offer_collections.map((r) => r.collection_id),
    }));
});

/** book_id -> collection ids, only for collections that some live offer targets. */
const getOfferCollectionMembership = cache(async (collectionIdsKey: string): Promise<Map<string, Set<string>>> => {
  const map = new Map<string, Set<string>>();
  const ids = collectionIdsKey ? collectionIdsKey.split(",") : [];
  if (!ids.length) return map;
  const { data, error } = await createPublicClient()
    .from("collection_books")
    .select("collection_id, book_id")
    .in("collection_id", ids);
  if (error) {
    console.error("[offers] membership read failed:", error.message);
    return map;
  }
  for (const row of data ?? []) {
    const set = map.get(row.book_id) ?? new Set<string>();
    set.add(row.collection_id);
    map.set(row.book_id, set);
  }
  return map;
});

/** Adds server-computed pricing to any list of books. */
export async function withPricing<T extends PriceableBook>(books: T[]): Promise<Array<T & { pricing: Pricing }>> {
  const offers = await getLiveOffers();
  const collectionIds = [...new Set(offers.flatMap((o) => (o.applies_to === "collections" ? o.collectionIds : [])))].sort();
  const membership = await getOfferCollectionMembership(collectionIds.join(","));
  return books.map((b) => ({ ...b, pricing: priceBook(b, offers, membership.get(b.id)) }));
}
