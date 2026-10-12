import Link from "next/link";
import { collectionSection } from "@/config/analytics";
import { HOME } from "@/config/site";
import { plural } from "@/lib/format";
import { langOf } from "@/lib/bangla";
import { TrackSection } from "@/features/analytics/track-section";
import { BookTile } from "@/features/books/components/book-tile";
import { BookCover } from "@/features/books/components/book-cover";
import { PriceTag } from "@/features/books/components/price-tag";
import { coverUrl } from "@/features/books/cover";
import type { CollectionWithBooks } from "@/features/collections/queries";
import { SectionHead } from "@/components/section-head";
import { IconArrow } from "@/components/icons";

type Props = { collection: CollectionWithBooks; symbol: string };

/** Forest shelves size their columns to the books they have (1 to 4). */
const FOREST_COLS: Record<number, string> = { 1: "sm:grid-cols-2", 2: "sm:grid-cols-3", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" };

/**
 * Each collection gets a mood instead of the same grid:
 * forest = a dark green spread, paper = newspaper columns over a shelf,
 * ink = a framed table of contents. The admin picks the mood per collection.
 */
export function CollectionFeature({ collection, symbol }: Props) {
  if (!collection.books.length) return null;
  const books = collection.books.slice(0, HOME.collectionPreviewCount);
  const href = `/collections/${collection.slug}`;
  const section = collectionSection(collection.slug);
  const count = collection.books.length;
  const intro = collection.editorial_intro || collection.description;

  if (collection.mood === "forest") {
    return (
      <TrackSection name={section} className="bg-green-900 py-16 text-paper md:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label text-green-300">Collection · {plural(count, "book")}</p>
            <h2 lang={langOf(collection.name)} className="mt-3 text-display font-semibold">
              {collection.name}
            </h2>
            {intro && <p lang={langOf(intro)} className="mt-5 text-lead text-green-100">{intro}</p>}
            <Link href={href} className="btn btn-on-dark mt-8">
              Open the collection
              <IconArrow size={18} />
            </Link>
          </div>
          <ul className={`grid grid-cols-2 gap-x-5 gap-y-10 lg:col-span-8 lg:pt-6 ${FOREST_COLS[Math.min(4, books.length)] ?? ""}`}>
            {books.slice(0, 4).map((b) => (
              <li key={b.id} className="min-w-0">
                <BookTile book={b} symbol={symbol} tone="dark" sizes="(min-width: 1024px) 180px, 45vw" />
              </li>
            ))}
          </ul>
        </div>
      </TrackSection>
    );
  }

  if (collection.mood === "ink") {
    return (
      <TrackSection name={section} className="container-x py-16 md:py-24">
        <div className="border-2 border-ink p-5 md:p-10">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="label text-ink-3">Collection · contents</p>
              <h2 lang={langOf(collection.name)} className="mt-2 text-headline font-semibold">
                {collection.name}
              </h2>
            </div>
            {intro && (
              <p lang={langOf(intro)} className="text-ink-2 md:col-span-6 md:col-start-7 md:self-end">
                {intro}
              </p>
            )}
          </div>
          <ol className="mt-8 grid gap-x-10 border-t-[3px] border-ink md:grid-cols-2">
            {books.map((b, i) => (
              <li key={b.id} className="border-b border-ink">
                <Link href={`/books/${b.slug}`} className="book-link grid grid-cols-[1.75rem_2.75rem_minmax(0,1fr)_auto] items-center gap-3 py-3" data-book-id={b.id}>
                  <span className="micro text-ink-3 tnum">{String(i + 1).padStart(2, "0")}</span>
                  <BookCover src={coverUrl(b)} title={b.title} sizes="44px" />
                  <span className="min-w-0">
                    <span lang={langOf(b.title)} className="line-clamp-1 font-semibold">{b.title}</span>
                    <span className="block truncate text-small text-ink-3">{b.author}</span>
                  </span>
                  <PriceTag pricing={b.pricing} symbol={symbol} size="sm" className="flex-col items-end" />
                </Link>
              </li>
            ))}
          </ol>
          <Link href={href} className="group mt-6 inline-flex min-h-11 items-center gap-2 font-semibold">
            <span className="link">{count === 1 ? "The book in this collection" : `All ${count} books in this collection`}</span>
            <IconArrow size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </TrackSection>
    );
  }

  // paper: a short shelf sits beside the intro instead of leaving a half-empty row.
  if (books.length <= 3) {
    return (
      <TrackSection name={section} className="container-x py-16 md:py-24">
        <SectionHead kicker={`Collection · ${plural(count, "book")}`} title={<span lang={langOf(collection.name)}>{collection.name}</span>} rule="double" size="display" href={href} linkLabel="Open the collection" />
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          {intro && (
            <p lang={langOf(intro)} className="text-lead text-ink-2 lg:col-span-4">
              {intro}
            </p>
          )}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:col-span-8">
            {books.map((b) => (
              <li key={b.id} className="min-w-0">
                <BookTile book={b} symbol={symbol} sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw" />
              </li>
            ))}
          </ul>
        </div>
      </TrackSection>
    );
  }

  return (
    <TrackSection name={section} className="container-x py-16 md:py-24">
      <SectionHead kicker={`Collection · ${plural(count, "book")}`} title={<span lang={langOf(collection.name)}>{collection.name}</span>} rule="double" size="display" href={href} linkLabel="Open the collection" />
      {intro && (
        <p lang={langOf(intro)} className="mt-6 text-ink-2 md:columns-2 md:gap-10 lg:w-3/4">
          {intro}
        </p>
      )}
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-6">
        {books.map((b) => (
          <li key={b.id} className="min-w-0">
            <BookTile book={b} symbol={symbol} sizes="(min-width: 1024px) 180px, (min-width: 640px) 30vw, 45vw" />
          </li>
        ))}
      </ul>
    </TrackSection>
  );
}
