import { SECTIONS } from "@/config/analytics";
import { HOME } from "@/config/site";
import { cn } from "@/lib/cn";
import { shopHref } from "@/features/books/catalog";
import type { BookCard } from "@/features/books/types";
import type { CollectionWithBooks } from "@/features/collections/queries";
import { TrackSection } from "@/features/analytics/track-section";
import { SectionHead } from "@/components/section-head";
import { OfferStub } from "@/features/offers/offer-stub";
import type { ActiveOffer } from "@/features/offers/pricing";

type Props = {
  offers: ActiveOffer[];
  books: BookCard[];
  collections: CollectionWithBooks[];
  symbol: string;
};

/** Up to four live offers, ending soonest first. The first one is set larger. */
export function OffersSection({ offers, books, collections, symbol }: Props) {
  const list = [...offers]
    .sort((a, b) => (a.end_at ? Date.parse(a.end_at) : Infinity) - (b.end_at ? Date.parse(b.end_at) : Infinity))
    .map((o) => ({ offer: o, count: books.filter((b) => b.pricing.offer?.id === o.id).length }))
    .filter((x) => x.count > 0)
    .slice(0, HOME.maxOffers);
  if (!list.length) return null;

  const collectionById = new Map(collections.map((c) => [c.id, c]));

  return (
    <TrackSection name={SECTIONS.offers} className="border-y-[3px] border-ink bg-paper-2 py-12 md:py-16">
      <div className="container-x">
        <SectionHead kicker="Running now" title="On offer" rule="none" className="pt-0">
          <p className="mt-2 max-w-xl text-ink-2">Prices below already include the discount. The message you send says so too.</p>
        </SectionHead>
        <ul className={cn("mt-8 grid gap-5", list.length > 1 && "md:grid-cols-2", list.length > 2 && "xl:grid-cols-4")}>
          {list.map(({ offer, count }, i) => {
            const targetCollections = offer.collectionIds.map((id) => collectionById.get(id)).filter(Boolean);
            const single = offer.applies_to === "collections" && targetCollections.length === 1 ? targetCollections[0] : null;
            const appliesLabel =
              offer.applies_to === "all"
                ? "Every book"
                : offer.applies_to === "collections"
                  ? targetCollections.map((c) => c!.name).join(", ") || "Selected collections"
                  : count === 1
                    ? "One book"
                    : "Selected books";
            const large = i === 0 && list.length !== 2;
            return (
              <li key={offer.id} className={cn(large && list.length > 2 && "md:col-span-2 xl:col-span-2", large && list.length === 1 && "md:col-span-2")}>
                <OfferStub
                  offer={offer}
                  symbol={symbol}
                  href={single ? `/collections/${single.slug}` : shopHref({ offer: offer.id })}
                  appliesLabel={appliesLabel}
                  bookCount={count}
                  large={large}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </TrackSection>
  );
}
