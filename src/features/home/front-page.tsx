import Link from "next/link";
import { SECTIONS } from "@/config/analytics";
import { formatDate, formatLongDate, plural } from "@/lib/format";
import { langOf } from "@/lib/bangla";
import { TrackSection } from "@/features/analytics/track-section";
import { BookCover } from "@/features/books/components/book-cover";
import { PriceTag } from "@/features/books/components/price-tag";
import { BookBadges } from "@/features/books/components/book-badges";
import { coverUrl } from "@/features/books/cover";
import type { BookCard } from "@/features/books/types";
import { BuyButton } from "@/features/whatsapp/buy-button";
import { toMessageBook } from "@/features/whatsapp/message";

type Props = {
  newest: BookCard | null;
  featured: BookCard[];
  bookCount: number;
  symbol: string;
};

const STEPS = ["Pick a book", "Read the preview", "Send one message", "Get the PDF"];

/**
 * The front page, set like a newspaper: dateline, a big statement of what
 * eBoi is and how it works, and the newest book as the lead story. Left
 * aligned and asymmetric on purpose: no centered hero, no feature cards.
 */
export function FrontPage({ newest, featured, bookCount, symbol }: Props) {
  return (
    <TrackSection name={SECTIONS.frontPage} className="container-x pt-4 pb-16 md:pb-24" aria-labelledby="front-title">
      <div className="micro flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-ink pb-2 text-ink-2">
        <span>{formatLongDate(new Date())}</span>
        <span>Dhaka</span>
        <span>{plural(bookCount, "PDF")} on the shelf</span>
      </div>

      <div className="mt-8 grid gap-12 md:mt-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <p className="label text-ink-3">A small PDF bookshop</p>
          <h1 id="front-title" className="mt-4 text-mega font-semibold">
            Read the first pages. <em className="font-medium text-green-700">Then decide.</em>
          </h1>
          <p className="mt-6 max-w-[34rem] text-lead text-ink-2">
            eBoi sells finished, well-set PDF books. Every book has a free preview right here. When you want the whole
            thing, send one WhatsApp message and the PDF arrives in the same chat.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/shop" className="btn btn-primary">
              {bookCount > 1 ? `Browse all ${bookCount} books` : "Browse the shop"}
            </Link>
            <Link href="/how-to-buy" className="btn btn-quiet">
              How buying works
            </Link>
          </div>

          <ol className="mt-12 grid grid-cols-2 border-t-[3px] border-ink sm:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s} className="border-b border-ink py-3 pr-3 sm:border-b-0 sm:border-l sm:pl-3 sm:first:border-l-0 sm:first:pl-0">
                <span className="micro text-green-700 tnum">0{i + 1}</span>
                <span className="mt-1 block text-small font-semibold leading-snug">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        {newest && (
          <div className="lg:col-span-5">
            <TrackSection name={SECTIONS.newest} as="div" bookId={newest.id} className="relative -mx-4 mt-10 bg-green-900 px-5 pt-0 pb-7 text-paper sm:mx-0 sm:px-7 lg:mt-24">
              <div className="flex items-end gap-5 sm:gap-7">
                <Link href={`/books/${newest.slug}`} className="book-link -mt-10 block w-[44%] max-w-[13.5rem] shrink-0 sm:-mt-14" data-book-id={newest.id}>
                  <BookCover src={coverUrl(newest)} title={newest.title} author={newest.author} sizes="(min-width: 1024px) 216px, 44vw" priority />
                </Link>
                <div className="min-w-0 pb-1">
                  <p className="micro text-green-300">
                    Just in{newest.release_date ? ` · ${formatDate(newest.release_date)}` : ""}
                  </p>
                  <BookBadges badge={newest.badge} pricing={newest.pricing} className="mt-2 flex flex-wrap gap-1.5" />
                </div>
              </div>
              <Link href={`/books/${newest.slug}`} className="mt-6 block hover:underline" data-book-id={newest.id}>
                <h2 lang={langOf(newest.title)} className="text-headline font-semibold">
                  {newest.title}
                </h2>
              </Link>
              {newest.subtitle && <p lang={langOf(newest.subtitle)} className="mt-2 text-green-100">{newest.subtitle}</p>}
              <p className="mt-3 text-small text-green-300">by {newest.author}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-green-700 pt-5">
                <PriceTag pricing={newest.pricing} symbol={symbol} size="lg" className="[&_.price]:text-paper [&_.price-was]:text-green-300" />
                <BuyButton book={toMessageBook(newest)} section={SECTIONS.newest} variant="on-dark" className="w-full sm:w-auto" />
              </div>
            </TrackSection>

            {featured.length > 0 && (
              <div className="mt-8">
                <p className="label text-ink-3">Also on the front page</p>
                <ul className="mt-3">
                  {featured.map((b) => (
                    <li key={b.id} className="border-t border-ink">
                      <Link href={`/books/${b.slug}`} className="book-link flex items-center gap-4 py-3" data-book-id={b.id}>
                        <BookCover src={coverUrl(b)} title={b.title} sizes="48px" className="w-12 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span lang={langOf(b.title)} className="line-clamp-1 font-semibold">{b.title}</span>
                          <span className="block truncate text-small text-ink-3">{b.author}</span>
                        </span>
                        <PriceTag pricing={b.pricing} symbol={symbol} size="sm" className="flex-col items-end" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </TrackSection>
  );
}
