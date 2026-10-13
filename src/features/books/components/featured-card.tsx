import Link from "next/link";
import { langOf } from "@/lib/bangla";
import { coverUrl } from "../cover";
import type { BookCard } from "../types";
import { BookCover } from "./book-cover";
import { DiscountBadge, StatusBadge } from "./book-badges";
import { PriceTag } from "./price-tag";
import { Rating } from "./rating";
import { PreviewButton } from "./preview-button";
import { BuyButton } from "@/features/whatsapp/buy-button";
import { toMessageBook } from "@/features/whatsapp/message";
import { ListButton } from "@/features/my-list/list-button";

/** Wide spotlight card for the newest book: cover, summary, price and actions. */
export function FeaturedCard({ book, symbol, summary, section }: { book: BookCard; symbol: string; summary: string; section: string }) {
  const href = `/books/${book.slug}`;
  return (
    <article className="flex flex-col gap-5 rounded-lg border border-line bg-white p-4 sm:flex-row sm:p-6">
      <Link href={href} data-book-id={book.id} className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-44 md:w-52" tabIndex={-1} aria-hidden="true">
        <BookCover src={coverUrl(book)} alt={book.cover_alt} title={book.title} author={book.author} sizes="208px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge badge={book.badge} />
          <DiscountBadge pricing={book.pricing} symbol={symbol} />
        </div>
        <h3 className="mt-2 text-xl leading-snug font-semibold">
          <Link href={href} data-book-id={book.id} lang={langOf(book.title)} className="hover:text-brand">
            {book.title}
          </Link>
        </h3>
        {book.author && <p className="mt-0.5 text-base text-text-3">by {book.author}</p>}
        <Rating value={Number(book.rating)} count={book.rating_count} className="mt-2" />
        {summary && <p className="mt-3 line-clamp-3 text-base text-text-2">{summary}</p>}
        <div className="mt-auto pt-4">
          <PriceTag pricing={book.pricing} symbol={symbol} size="lg" />
          <div className="mt-3 flex flex-wrap gap-2">
            <BuyButton book={toMessageBook(book)} section={section} className="flex-1 sm:flex-none" />
            {book.preview_path && (
              <PreviewButton
                book={{ ...toMessageBook(book), page_count: book.page_count, preview_page_count: book.preview_page_count }}
                className="flex-1 sm:flex-none"
              />
            )}
            <ListButton bookId={book.id} section={section} />
          </div>
        </div>
      </div>
    </article>
  );
}
