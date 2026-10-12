import { SECTIONS } from "@/config/analytics";
import { TrackSection } from "@/features/analytics/track-section";
import { BookGrid } from "@/features/books/components/book-grid";
import type { BookCard } from "@/features/books/types";
import { SectionHead } from "@/components/section-head";

export function LatestShelf({ books, symbol }: { books: BookCard[]; symbol: string }) {
  if (!books.length) return null;
  return (
    <TrackSection name={SECTIONS.latest} className="container-x pb-16 md:pb-24" aria-labelledby="latest-title">
      <SectionHead id="latest-title" kicker="New on the shelf" title="Latest arrivals" href="/collections/latest" />
      <BookGrid books={books} symbol={symbol} cols={4} className="mt-8" />
    </TrackSection>
  );
}
