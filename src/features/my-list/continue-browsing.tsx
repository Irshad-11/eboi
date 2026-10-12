"use client";

import Link from "next/link";
import Image from "next/image";
import { SECTIONS } from "@/config/analytics";
import { TrackSection } from "@/features/analytics/track-section";
import { useShop } from "@/features/layout/shop-context";
import { PriceTag } from "@/features/books/components/price-tag";
import { useRecent } from "./store";
import { useBooksByIds } from "./use-books";

/**
 * "Continue browsing": the last books this visitor opened, from their own
 * browser. Renders nothing for first-time visitors, so it adds no layout
 * shift for them.
 */
export function ContinueBrowsing({ excludeId }: { excludeId?: string }) {
  const ids = useRecent().filter((id) => id !== excludeId).slice(0, 6);
  const { books } = useBooksByIds(ids);
  const { currency_symbol } = useShop();
  if (!books.length) return null;

  return (
    <TrackSection name={SECTIONS.continueBrowsing} className="container-x py-10" aria-labelledby="continue-title">
      <div className="flex items-baseline justify-between gap-4 border-t border-ink pt-3">
        <h2 id="continue-title" className="label text-ink-2">
          Continue where you left off
        </h2>
        <Link href="/my-list" className="micro link text-ink-3">
          My List
        </Link>
      </div>
      <ul className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-6">
        {books.map((b) => (
          <li key={b.id} className="min-w-0">
            <Link href={`/books/${b.slug}`} className="book-link block" data-book-id={b.id}>
              <div className="cover">
                {b.coverUrl && <Image src={b.coverUrl} alt={`Cover of ${b.title}`} fill sizes="(min-width: 640px) 120px, 30vw" />}
              </div>
              <p className="mt-2 line-clamp-1 text-small font-semibold">{b.title}</p>
              <PriceTag pricing={b.pricing} symbol={currency_symbol} size="sm" />
            </Link>
          </li>
        ))}
      </ul>
    </TrackSection>
  );
}
