import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { IconArrowRight, IconClock } from "@/components/icons";
import { BookCover } from "@/features/books/components/book-cover";
import { coverUrl } from "@/features/books/cover";
import type { BookCard } from "@/features/books/types";
import { Countdown } from "./countdown";
import type { ActiveOffer } from "./pricing";

/** An offer: red discount, name, up to three covers, optional countdown. */
export function DealCard({ offer, books, href, symbol }: { offer: ActiveOffer; books: BookCard[]; href: string; symbol: string }) {
  const label = offer.discount_type === "percent" ? `${Number(offer.value)}% off` : `${formatPrice(Number(offer.value), symbol)} off`;
  const lowest = books.length ? Math.min(...books.map((b) => b.pricing.final)) : null;
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-lg border border-line bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="badge badge-sale h-7 px-2.5 text-sm">{label}</span>
        {offer.end_at && offer.show_countdown && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-sale">
            <IconClock size={15} />
            <Countdown endAt={offer.end_at} />
          </span>
        )}
      </div>
      <h3 className="mt-3 text-md font-semibold group-hover:text-brand">{offer.title}</h3>
      {offer.banner_text && <p className="mt-1 line-clamp-2 text-sm text-text-3">{offer.banner_text}</p>}
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex -space-x-5">
          {books.slice(0, 3).map((b, i) => (
            <BookCover
              key={b.id}
              src={coverUrl(b)}
              title={b.title}
              alt={b.cover_alt}
              sizes="64px"
              className={cn("w-14 border-2 border-white sm:w-16", i === 1 && "translate-y-1", i === 2 && "translate-y-2")}
            />
          ))}
        </div>
        <div className="text-right">
          {lowest != null && (
            <p className="text-sm text-text-3">
              From <span className="price-now text-base" data-sale="true">{formatPrice(lowest, symbol)}</span>
            </p>
          )}
          <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand">
            {books.length} {books.length === 1 ? "book" : "books"}
            <IconArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
