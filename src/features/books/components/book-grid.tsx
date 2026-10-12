import { cn } from "@/lib/cn";
import type { BookCard } from "../types";
import { BookTile } from "./book-tile";

/**
 * Catalogue grid. Two columns at 360px (covers stay big enough to read the
 * title), five at desktop: catalogue density like a real bookshop shelf.
 */
const COLS = {
  // Catalogue density for the shop.
  5: "sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  // Shelves inside a narrower column or with a fixed count of 4/8.
  4: "sm:grid-cols-3 lg:grid-cols-4",
} as const;

export function BookGrid({
  books,
  symbol,
  className,
  priorityCount = 0,
  cols = 5,
}: {
  books: BookCard[];
  symbol: string;
  className?: string;
  priorityCount?: number;
  cols?: keyof typeof COLS;
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6", COLS[cols], className)}>
      {books.map((b, i) => (
        <li key={b.id} className="min-w-0">
          <BookTile book={b} symbol={symbol} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
