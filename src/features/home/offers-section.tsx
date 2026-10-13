import { SECTIONS } from "@/config/analytics";
import { HOME } from "@/config/site";
import { shopHref } from "@/features/books/catalog";
import type { BookCard } from "@/features/books/types";
import type { CollectionWithBooks } from "@/features/collections/queries";
import { TrackSection } from "@/features/analytics/track-section";
import { SectionHead } from "@/components/section-head";
import { DealCard } from "@/features/offers/deal-card";
import type { ActiveOffer } from "@/features/offers/pricing";

/** Up to four live offers, ending soonest first. */
export function OffersSection({
  offers,
  books,
  collections,
  symbol,
}: {
  offers: ActiveOffer[];
  books: BookCard[];
  collections: CollectionWithBooks[];
  symbol: string;
}) {
  const list = [...offers]
    .sort((a, b) => (a.end_at ? Date.parse(a.end_at) : Infinity) - (b.end_at ? Date.parse(b.end_at) : Infinity))
    .map((o) => ({ offer: o, books: books.filter((b) => b.pricing.offer?.id === o.id) }))
    .filter((x) => x.books.length > 0)
    .slice(0, HOME.maxOffers);
  if (!list.length) return null;
  const bySlug = new Map(collections.map((c) => [c.id, c.slug]));

  return (
    <TrackSection name={SECTIONS.offers} className="container-x py-4 md:py-5" aria-labelledby="offers-title">
      <SectionHead id="offers-title" title="Offers" href="/shop?deals=1" linkLabel="See all offers" />
      {/* Phones: a swipe row with the next card peeking. Larger screens: a grid. */}
      <ul
        className="scrollbar-none relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-[repeat(var(--cols-lg),minmax(0,1fr))] lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
        style={{ ["--cols-lg" as string]: Math.min(list.length, 3), ["--cols" as string]: Math.min(list.length, 4) }}
      >
        {list.map(({ offer, books: b }) => {
          const single = offer.applies_to === "collections" && offer.collectionIds.length === 1 ? bySlug.get(offer.collectionIds[0]!) : null;
          return (
            <li key={offer.id} className={list.length > 1 ? "w-[85%] max-w-[22rem] shrink-0 snap-start lg:w-auto lg:max-w-none" : "w-full shrink-0"}>
              <DealCard offer={offer} books={b} symbol={symbol} href={single ? `/collections/${single}` : shopHref({ offer: offer.id })} />
            </li>
          );
        })}
      </ul>
    </TrackSection>
  );
}
