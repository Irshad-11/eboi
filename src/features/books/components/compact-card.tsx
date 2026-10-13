import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { langOf } from "@/lib/bangla";
import type { BookLite } from "../types";
import { PriceTag } from "./price-tag";

/**
 * Horizontal card: small cover, title, author, price. Used for My List,
 * recently viewed and search suggestions. Works in client components.
 */
export function CompactCard({
  book,
  symbol,
  action,
  onNavigate,
  className,
  dense = false,
}: {
  book: BookLite;
  symbol: string;
  action?: ReactNode;
  onNavigate?: () => void;
  className?: string;
  dense?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Link href={`/books/${book.slug}`} onClick={onNavigate} data-book-id={book.id} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <div className={cn("cover-frame", dense ? "w-10" : "w-14")}>
          {book.coverUrl ? (
            <Image src={book.coverUrl} alt="" fill sizes={dense ? "40px" : "56px"} />
          ) : (
            <div className="absolute inset-0 bg-brand" />
          )}
        </div>
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/books/${book.slug}`}
          onClick={onNavigate}
          data-book-id={book.id}
          lang={langOf(book.title)}
          className="line-clamp-2 text-base leading-snug font-semibold hover:text-brand"
        >
          {book.title}
        </Link>
        {!dense && book.author && <p className="truncate text-sm text-text-3">{book.author}</p>}
        <PriceTag pricing={book.pricing} symbol={symbol} size="sm" />
      </div>
      {action}
    </div>
  );
}
