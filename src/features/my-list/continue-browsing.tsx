"use client";

import { SECTIONS } from "@/config/analytics";
import { SectionHead } from "@/components/section-head";
import { useShop } from "@/features/layout/shop-context";
import { CompactCard } from "@/features/books/components/compact-card";
import { useRecent } from "./store";
import { useBooksByIds } from "./use-books";

/**
 * Recently viewed, from this browser. Renders nothing for first-time
 * visitors, so it causes no layout shift for them.
 */
export function ContinueBrowsing({ excludeId, title = "Recently viewed" }: { excludeId?: string; title?: string }) {
  const ids = useRecent().filter((id) => id !== excludeId).slice(0, 8);
  const { books } = useBooksByIds(ids);
  const { currency_symbol } = useShop();
  if (!books.length) return null;
  return (
    <section data-section={SECTIONS.recent} className="container-x py-4 md:py-5" aria-labelledby="recent-title">
      <SectionHead id="recent-title" title={title} />
      <ul className="scrollbar-none relative -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {books.map((b) => (
          <li key={b.id} className="w-64 shrink-0 snap-start rounded-lg border border-line bg-white p-2.5">
            <CompactCard book={b} symbol={currency_symbol} />
          </li>
        ))}
      </ul>
    </section>
  );
}
