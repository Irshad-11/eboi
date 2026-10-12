import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { SECTIONS } from "@/config/analytics";
import { formatCompact } from "@/lib/format";
import { langOf } from "@/lib/bangla";
import { getBookBySlug, getPublishedBooks, relatedBooks, resolveOldBookSlug } from "@/features/books/queries";
import { getSettings } from "@/features/settings/queries";
import { coverUrl } from "@/features/books/cover";
import { BookCover } from "@/features/books/components/book-cover";
import { BookBadges } from "@/features/books/components/book-badges";
import { PriceTag } from "@/features/books/components/price-tag";
import { Rating } from "@/features/books/components/rating";
import { BookGrid } from "@/features/books/components/book-grid";
import { Colophon } from "@/features/book-detail/colophon";
import { StickyBuyBar } from "@/features/book-detail/sticky-buy-bar";
import { TrackSection } from "@/features/analytics/track-section";
import { BuyButton } from "@/features/whatsapp/buy-button";
import { toMessageBook } from "@/features/whatsapp/message";
import { ListButton } from "@/features/my-list/list-button";
import { BookViewTracker } from "@/features/my-list/recent-tracker";
import { ContinueBrowsing } from "@/features/my-list/continue-browsing";
import { PreviewViewer } from "@/features/preview/preview-viewer";
import { Countdown } from "@/features/offers/countdown";
import { Breadcrumbs } from "@/features/seo/breadcrumbs";
import { JsonLd, bookJsonLd } from "@/features/seo/jsonld";
import { excerpt, pageMetadata } from "@/features/seo/metadata";
import { RichText } from "@/components/rich-text";
import { IconPages } from "@/components/icons";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

/** Rendered on first request, then cached; admin saves purge the cache. */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: "Book not found", robots: { index: false } };
  return pageMetadata({
    title: book.seo_title || `${book.title}${book.author ? ` by ${book.author}` : ""} (PDF)`,
    description: book.seo_description || excerpt(book.subtitle ? `${book.subtitle}. ${book.description}` : book.description),
    path: `/books/${book.slug}`,
    type: "book",
  });
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) {
    // Links shared before a slug change keep working (permanent redirect).
    const moved = await resolveOldBookSlug(slug);
    if (moved) permanentRedirect(`/books/${moved}`);
    notFound();
  }

  const [all, settings] = await Promise.all([getPublishedBooks(), getSettings()]);
  const symbol = settings.currency_symbol;
  const related = relatedBooks(book, all, 4);
  const msgBook = toMessageBook(book);
  const path = `/books/${book.slug}`;
  const offer = book.pricing.offer;

  return (
    <>
      <JsonLd data={bookJsonLd(book)} />
      <BookViewTracker bookId={book.id} />

      <div className="container-x pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: book.category, path: `/shop?category=${encodeURIComponent(book.category)}` },
            { name: book.title, path },
          ]}
        />

        <article className="mt-6 grid grid-cols-[38%_minmax(0,1fr)] gap-x-5 gap-y-8 md:mt-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">
          <div className="lg:col-span-4 lg:row-span-2">
            <div className="lg:sticky lg:top-6">
              <BookCover src={coverUrl(book)} title={book.title} author={book.author} sizes="(min-width: 1024px) 380px, 38vw" priority />
              <p className="micro mt-5 hidden text-ink-3 lg:block">Book ID {book.book_code} · Sent as a PDF on WhatsApp</p>
            </div>
          </div>

          <header className="min-w-0 lg:col-span-5">
            <p className="label text-ink-3">
              {book.category} · {book.language}
            </p>
            <h1 lang={langOf(book.title)} className="mt-2 text-[1.625rem] leading-[1.08] font-semibold tracking-[-0.015em] sm:text-headline lg:text-display">
              {book.title}
            </h1>
            {book.subtitle && (
              <p lang={langOf(book.subtitle)} className="mt-3 text-ink-2 sm:text-lead">
                {book.subtitle}
              </p>
            )}
            <p className="mt-3 text-small sm:text-body">
              by <span className="font-semibold">{book.author}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Rating value={Number(book.rating)} count={book.rating_count} />
              <BookBadges badge={book.badge} pricing={book.pricing} isDemo={book.is_demo} />
            </div>
          </header>

          {/* Buy box. Its id is what the mobile sticky bar watches. */}
          <aside id="buy-box" aria-label="Buy this book" className="col-span-2 lg:col-span-3 lg:col-start-10 lg:row-span-2 lg:row-start-1">
            <TrackSection name={SECTIONS.detailBuyBox} as="div" bookId={book.id} className="border-2 border-ink bg-paper-raised p-5 lg:sticky lg:top-6">
              <p className="label text-ink-3">Price</p>
              <PriceTag pricing={book.pricing} symbol={symbol} size="lg" className="mt-2" />
              {offer && (
                <p className="mt-2 text-small text-ochre-ink">
                  <span className="font-semibold">{offer.title}</span>
                  {offer.end_at && offer.show_countdown && (
                    <>
                      {" · "}
                      <Countdown endAt={offer.end_at} className="font-mono" />
                    </>
                  )}
                </p>
              )}
              <div className="mt-5 grid gap-3">
                <BuyButton book={msgBook} section={SECTIONS.detailBuyBox} className="w-full" />
                <ListButton bookId={book.id} section={SECTIONS.detailBuyBox} className="w-full" />
                {book.preview_path && (
                  <a href="#preview" className="btn btn-quiet w-full">
                    <IconPages size={18} />
                    Read the first pages free
                  </a>
                )}
              </div>
              <p className="mt-5 border-t border-paper-3 pt-4 text-small text-ink-3">{settings.delivery_note}</p>
              {(book.total_sells > 0 || book.views > 0) && (
                <p className="micro mt-3 text-ink-3">
                  {book.total_sells > 0 && <>{formatCompact(book.total_sells)} sold</>}
                  {book.total_sells > 0 && book.views > 0 && " · "}
                  {book.views > 0 && <>{formatCompact(book.views)} views</>}
                </p>
              )}
            </TrackSection>
          </aside>

          <div className="col-span-2 min-w-0 space-y-10 lg:col-span-5 lg:col-start-5 lg:row-start-2">
            <Colophon book={book} />
            {book.highlights.length > 0 && (
              <TrackSection name={SECTIONS.detailHighlights} bookId={book.id} aria-labelledby="get-title">
                <h2 id="get-title" className="border-t-[3px] border-ink pt-3 text-title font-semibold">
                  What you get
                </h2>
                <ul className="mt-4 space-y-3">
                  {book.highlights.map((h) => (
                    <li key={h} lang={langOf(h)} className="grid grid-cols-[1.25rem_1fr] gap-2">
                      <span className="mt-[0.55em] block size-2 bg-green-700" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              </TrackSection>
            )}
          </div>
        </article>

        {book.description && (
          <TrackSection name={SECTIONS.detailDescription} bookId={book.id} className="mt-16 grid gap-6 border-t-[3px] border-ink pt-6 lg:grid-cols-12 lg:gap-8" aria-labelledby="about-book">
            <h2 id="about-book" className="label text-ink-3 lg:col-span-3">
              About this book
            </h2>
            <RichText text={book.description} className="text-lead lg:col-span-7" />
          </TrackSection>
        )}

        {book.table_of_contents && (
          <TrackSection name={SECTIONS.detailToc} bookId={book.id} className="mt-14 grid gap-6 lg:grid-cols-12 lg:gap-8" aria-labelledby="toc-title">
            <h2 id="toc-title" className="label text-ink-3 lg:col-span-3 lg:pt-6">
              Contents
            </h2>
            <div className="border-2 border-ink p-5 md:p-6 lg:col-span-7">
              <pre lang={langOf(book.table_of_contents)} className="font-serif text-body leading-relaxed whitespace-pre-wrap">
                {book.table_of_contents}
              </pre>
            </div>
          </TrackSection>
        )}

        {book.preview_path && (
          <TrackSection name={SECTIONS.detailPreview} bookId={book.id} id="preview" className="mt-16 scroll-mt-6 lg:grid lg:grid-cols-12 lg:gap-8" aria-labelledby="preview-title">
            <h2 id="preview-title" className="label mb-4 text-ink-3 lg:col-span-3 lg:mb-0 lg:pt-6">
              Free preview
            </h2>
            <div className="lg:col-span-9">
              <PreviewViewer book={{ ...msgBook, page_count: book.page_count, preview_page_count: book.preview_page_count }} />
            </div>
          </TrackSection>
        )}

        {related.length > 0 && (
          <TrackSection name={SECTIONS.detailRelated} bookId={book.id} className="mt-20 border-t-[3px] border-ink pt-6 pb-8" aria-labelledby="related-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="related-title" className="text-headline font-semibold">
                If you like this one
              </h2>
              <Link href={`/shop?category=${encodeURIComponent(book.category)}`} className="link inline-flex min-h-11 items-center">
                More in {book.category}
              </Link>
            </div>
            <BookGrid books={related} symbol={symbol} cols={4} className="mt-8" />
          </TrackSection>
        )}
      </div>

      <ContinueBrowsing excludeId={book.id} />
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <StickyBuyBar book={msgBook} targetId="buy-box" />
    </>
  );
}
