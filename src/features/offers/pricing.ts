import type { DiscountType, OfferScope } from "@/lib/supabase/database.types";

/**
 * Pure pricing rules, shared by the server (source of truth) and the admin
 * preview. The browser never computes a price that is shown to buyers.
 */

export type ActiveOffer = {
  id: string;
  title: string;
  banner_text: string;
  discount_type: DiscountType;
  value: number;
  applies_to: OfferScope;
  start_at: string;
  end_at: string | null;
  show_countdown: boolean;
  bookIds: string[];
  collectionIds: string[];
};

export type AppliedOffer = Pick<ActiveOffer, "id" | "title" | "banner_text" | "end_at" | "show_countdown">;

export type Pricing = {
  /** The book's list price. */
  base: number;
  /** What the buyer pays. */
  final: number;
  /** Shown struck through: the list price during an offer, or a manual old price. */
  was: number | null;
  offer: AppliedOffer | null;
  savePercent: number | null;
};

export type PriceableBook = { id: string; price: number; old_price: number | null; offer_id: string | null };

export function isOfferLive(o: { start_at: string; end_at: string | null }, now = Date.now()): boolean {
  return new Date(o.start_at).getTime() <= now && (!o.end_at || new Date(o.end_at).getTime() > now);
}

export function applyDiscount(base: number, type: DiscountType, value: number): number {
  const raw = type === "percent" ? base * (1 - value / 100) : base - value;
  // Whole taka only: nobody wants to send ৳169.15 over bKash.
  return Math.max(0, Math.round(raw));
}

function offerTargets(offer: ActiveOffer, book: PriceableBook, bookCollections: ReadonlySet<string>): boolean {
  if (book.offer_id === offer.id) return true;
  switch (offer.applies_to) {
    case "all":
      return true;
    case "books":
      return offer.bookIds.includes(book.id);
    case "collections":
      return offer.collectionIds.some((c) => bookCollections.has(c));
  }
}

/**
 * Picks the single best live offer for a book (offers never stack: stacking
 * makes prices hard to explain in a WhatsApp message).
 */
export function priceBook(
  book: PriceableBook,
  offers: readonly ActiveOffer[],
  bookCollections: ReadonlySet<string> = new Set(),
): Pricing {
  const base = Number(book.price);
  let best: { offer: ActiveOffer; final: number } | null = null;

  for (const offer of offers) {
    if (!offerTargets(offer, book, bookCollections)) continue;
    const final = applyDiscount(base, offer.discount_type, Number(offer.value));
    if (final < base && (!best || final < best.final)) best = { offer, final };
  }

  if (best) {
    const { id, title, banner_text, end_at, show_countdown } = best.offer;
    return {
      base,
      final: best.final,
      was: base,
      offer: { id, title, banner_text, end_at, show_countdown },
      savePercent: base > 0 ? Math.round(((base - best.final) / base) * 100) : null,
    };
  }

  const old = book.old_price != null ? Number(book.old_price) : null;
  const was = old != null && old > base ? old : null;
  return {
    base,
    final: base,
    was,
    offer: null,
    savePercent: was ? Math.round(((was - base) / was) * 100) : null,
  };
}

/** Short human description of a discount: "20% off", "৳50 off". */
export function describeDiscount(type: DiscountType, value: number, symbol: string): string {
  return type === "percent" ? `${Number(value)}% off` : `${symbol}${Number(value)} off`;
}
