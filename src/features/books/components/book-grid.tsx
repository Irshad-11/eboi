import { cn } from "@/lib/cn";
import type { BookCard } from "../types";
import { ProductCard } from "./product-card";

/** Product grid: 2 columns at 360px up to 5 on wide screens (4 inside a sidebar layout). */
export function BookGrid({
  books,
  symbol,
  section,
  className,
  priorityCount = 0,
  withSidebar = false,
}: {
  books: BookCard[];
  symbol: string;
  section: string;
  className?: string;
  priorityCount?: number;
  withSidebar?: boolean;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4",
        withSidebar ? "lg:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-4 xl:grid-cols-5",
        className,
      )}
    >
      {books.map((b, i) => (
        <li key={b.id} className="min-w-0">
          <ProductCard book={b} symbol={symbol} section={section} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
