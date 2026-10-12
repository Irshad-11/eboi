import Link from "next/link";
import type { Metadata } from "next";
import { SECTIONS } from "@/config/analytics";
import { HOME } from "@/config/site";
import { SiteChrome } from "@/features/layout/site-chrome";
import { getPublishedBooks } from "@/features/books/queries";
import { getSettings } from "@/features/settings/queries";
import { BookGrid } from "@/features/books/components/book-grid";
import { TrackSection } from "@/features/analytics/track-section";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** A 404 that still sells: search, plus a few real books instead of a dead end. */
export default async function NotFound() {
  const [books, settings] = await Promise.all([getPublishedBooks(), getSettings()]);
  const suggestions = [...books].sort((a, b) => b.total_sells - a.total_sells).slice(0, HOME.latestCount / 2);
  return (
    <SiteChrome>
      <section className="container-x grid gap-10 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-7">
          <p className="label text-ink-3">Error 404</p>
          <h1 className="mt-4 text-mega font-semibold">This page is not on the shelf.</h1>
        </div>
        <div className="md:col-span-5 md:self-end">
          <p className="text-lead text-ink-2">
            The link may be old or mistyped. Book links never change on eBoi, so try searching for the title.
          </p>
          <form action="/shop" role="search" className="mt-6 flex gap-2">
            <label htmlFor="nf-q" className="sr-only">
              Search books
            </label>
            <input id="nf-q" name="q" type="search" className="input" placeholder="Title, author or Book ID" />
            <button className="btn btn-primary shrink-0">Search</button>
          </form>
          <Link href="/" className="link mt-4 inline-flex min-h-11 items-center">
            Go to the front page
          </Link>
        </div>
      </section>
      {suggestions.length > 0 && (
        <TrackSection name={SECTIONS.notFound} className="container-x border-t-[3px] border-ink py-12">
          <h2 className="text-headline">People are reading these</h2>
          <BookGrid books={suggestions} symbol={settings.currency_symbol} cols={4} className="mt-8" />
        </TrackSection>
      )}
    </SiteChrome>
  );
}
