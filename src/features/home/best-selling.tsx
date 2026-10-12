import Link from "next/link";
import { SECTIONS } from "@/config/analytics";
import { TrackSection } from "@/features/analytics/track-section";
import { BookRankRow } from "@/features/books/components/book-rank-row";
import type { BookCard } from "@/features/books/types";
import { IconArrow } from "@/components/icons";

/** A newspaper bestseller chart: rank numerals, small covers, dense rows. */
export function BestSelling({ books, symbol }: { books: BookCard[]; symbol: string }) {
  if (books.length < 2) return null;
  const half = Math.ceil(books.length / 2);
  return (
    <TrackSection name={SECTIONS.bestSelling} className="container-x py-16 md:py-24" aria-labelledby="best-title">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="border-t-[3px] border-ink pt-4 lg:sticky lg:top-6">
            <p className="label text-ink-3">The chart</p>
            <h2 id="best-title" className="mt-2 text-display font-semibold">
              Best selling
            </h2>
            <p className="mt-4 max-w-sm text-ink-2">Ranked by copies sold. If a book is here, people paid for it.</p>
            <Link href="/collections/best-selling" className="group mt-5 inline-flex min-h-11 items-center gap-2 font-semibold">
              <span className="link">Full chart</span>
              <IconArrow size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        <div className="grid gap-x-10 lg:col-span-8 md:grid-cols-2">
          <ol className="border-t-[3px] border-ink md:border-t-0">
            {books.slice(0, half).map((b, i) => (
              <BookRankRow key={b.id} book={b} rank={i + 1} symbol={symbol} />
            ))}
          </ol>
          <ol start={half + 1} className="border-t border-ink md:border-t-0">
            {books.slice(half).map((b, i) => (
              <BookRankRow key={b.id} book={b} rank={half + i + 1} symbol={symbol} />
            ))}
          </ol>
        </div>
      </div>
    </TrackSection>
  );
}
