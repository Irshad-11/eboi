import Link from "next/link";
import { formatCompact } from "@/lib/format";
import { langOf } from "@/lib/bangla";
import { coverUrl } from "../cover";
import type { BookCard } from "../types";
import { BookCover } from "./book-cover";
import { PriceTag } from "./price-tag";

/** A line in a newspaper-style bestseller chart. Dense by design. */
export function BookRankRow({ book, rank, symbol }: { book: BookCard; rank: number; symbol: string }) {
  return (
    <li className="border-t border-ink first:border-t-0 md:first:border-t">
      <Link
        href={`/books/${book.slug}`}
        className="book-link grid grid-cols-[2.25rem_3.25rem_minmax(0,1fr)] items-center gap-x-3 py-3.5 sm:grid-cols-[2.75rem_3.5rem_minmax(0,1fr)_auto]"
        data-book-id={book.id}
      >
        <span className="text-[1.875rem] leading-none font-semibold text-green-700 italic tnum">{rank}</span>
        <BookCover src={coverUrl(book)} title={book.title} sizes="56px" className="w-full" />
        <span className="min-w-0">
          <span lang={langOf(book.title)} className="line-clamp-2 leading-snug font-semibold">
            {book.title}
          </span>
          <span className="mt-0.5 block truncate text-small text-ink-3">
            {book.author}
            {book.total_sells > 0 && <span className="micro ml-2 text-ink-2">{formatCompact(book.total_sells)} sold</span>}
          </span>
          <PriceTag pricing={book.pricing} symbol={symbol} size="sm" className="mt-1 sm:hidden" />
        </span>
        <PriceTag pricing={book.pricing} symbol={symbol} size="sm" className="hidden flex-col items-end sm:inline-flex" />
      </Link>
    </li>
  );
}
