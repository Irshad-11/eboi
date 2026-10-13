import Link from "next/link";
import { cn } from "@/lib/cn";
import { langOf } from "@/lib/bangla";
import { coverUrl } from "../cover";
import type { BookCard } from "../types";
import { BookCover } from "./book-cover";
import { DiscountBadge, StatusBadge } from "./book-badges";
import { PriceTag } from "./price-tag";
import { Rating } from "./rating";
import { CardActions, SoldCount } from "./card-actions";

type Props = {
  book: BookCard;
  symbol: string;
  section: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/** Standard grid product card: cover, badges, title, author, rating, price. */
export function ProductCard({
  book,
  symbol,
  section,
  sizes = "(min-width: 1280px) 200px, (min-width: 768px) 22vw, 45vw",
  priority,
  className,
}: Props) {
  const href = `/books/${book.slug}`;
  return (
    <article className={cn("product-card relative flex h-full flex-col rounded-lg border border-line bg-surface p-2.5", className)}>
      <div className="relative">
        <Link href={href} data-book-id={book.id} tabIndex={-1} aria-hidden="true">
          <BookCover src={coverUrl(book)} alt={book.cover_alt} title={book.title} author={book.author} sizes={sizes} priority={priority} />
        </Link>
        <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">
          <DiscountBadge pricing={book.pricing} symbol={symbol} />
          <StatusBadge badge={book.badge} />
        </div>
        <CardActions
          section={section}
          hasPreview={Boolean(book.preview_path)}
          book={{
            id: book.id,
            title: book.title,
            slug: book.slug,
            book_code: book.book_code,
            pricing: book.pricing,
            page_count: book.page_count,
            preview_page_count: book.preview_page_count,
          }}
        />
      </div>
      <div className="mt-2.5 flex flex-1 flex-col gap-1 px-0.5">
        <h3 className="text-base leading-snug font-semibold">
          <Link href={href} data-book-id={book.id} lang={langOf(book.title)} className="line-clamp-2 hover:text-brand">
            {book.title}
          </Link>
        </h3>
        {book.author && (
          <p lang={langOf(book.author)} className="truncate text-sm text-text-3">
            {book.author}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <Rating value={Number(book.rating)} count={book.rating_count} size={12} className="text-xs" />
          <SoldCount sold={book.total_sells} />
        </div>
        <PriceTag pricing={book.pricing} symbol={symbol} size="sm" className="mt-auto pt-1" />
      </div>
    </article>
  );
}
