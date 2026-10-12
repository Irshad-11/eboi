import Link from "next/link";
import { cn } from "@/lib/cn";
import { langOf } from "@/lib/bangla";
import { coverUrl } from "../cover";
import type { BookCard } from "../types";
import { BookCover } from "./book-cover";
import { BookBadges } from "./book-badges";
import { PriceTag } from "./price-tag";

type Props = {
  book: BookCard;
  symbol: string;
  sizes?: string;
  priority?: boolean;
  /** "dark" for use on green panels. */
  tone?: "paper" | "dark";
  className?: string;
};

/** Grid card: cover first, then just enough text to decide whether to tap. */
export function BookTile({
  book,
  symbol,
  sizes = "(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw",
  priority,
  tone = "paper",
  className,
}: Props) {
  const dark = tone === "dark";
  return (
    <article className={cn("min-w-0", className)}>
      <Link href={`/books/${book.slug}`} className="book-link block" data-book-id={book.id}>
        <BookCover src={coverUrl(book)} title={book.title} author={book.author} sizes={sizes} priority={priority} />
        <div className="mt-4 space-y-1.5">
          <BookBadges badge={book.badge} pricing={book.pricing} />
          <h3
            lang={langOf(book.title)}
            className={cn("line-clamp-2 text-[1.0625rem] leading-snug font-semibold", dark ? "text-paper" : "text-ink")}
          >
            {book.title}
          </h3>
          <p lang={langOf(book.author)} className={cn("truncate text-small", dark ? "text-green-100" : "text-ink-3")}>
            {book.author}
          </p>
          <PriceTag pricing={book.pricing} symbol={symbol} size="sm" className={dark ? "[&_.price]:text-paper [&_.price-was]:text-green-300" : undefined} />
        </div>
      </Link>
    </article>
  );
}
