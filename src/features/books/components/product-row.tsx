import { Scroller } from "@/components/scroller";
import { SectionHead } from "@/components/section-head";
import { TrackSection } from "@/features/analytics/track-section";
import type { BookCard } from "../types";
import { ProductCard } from "./product-card";

/** A titled horizontal row of product cards with a "View all" link. */
export function ProductRow({
  title,
  books,
  symbol,
  section,
  href,
  id,
  lead,
}: {
  title: string;
  books: BookCard[];
  symbol: string;
  section: string;
  href?: string;
  id: string;
  /** Wider first card in the row, e.g. a collection intro. */
  lead?: React.ReactNode;
}) {
  if (!books.length) return null;
  return (
    <TrackSection name={section} className="container-x py-4 md:py-5" aria-labelledby={id}>
      <SectionHead id={id} title={title} href={href} />
      <Scroller label={title} lead={lead}>
        {books.map((b) => (
          <ProductCard key={b.id} book={b} symbol={symbol} section={section} sizes="(min-width: 1024px) 190px, (min-width: 640px) 30vw, 44vw" />
        ))}
      </Scroller>
    </TrackSection>
  );
}
