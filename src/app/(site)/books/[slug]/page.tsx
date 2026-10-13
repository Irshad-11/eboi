import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { SECTIONS } from "@/config/analytics";
import { absoluteUrl } from "@/lib/env";
import { formatDate, formatPrice } from "@/lib/format";
import { langOf } from "@/lib/bangla";
import { mediaUrl } from "@/lib/media";
import { htmlToText } from "@/lib/rich-text";
import { getBookBySlug, getBookReviews, getPublishedBooks, relatedBooks, resolveOldBookSlug } from "@/features/books/queries";
import { getCategorySlugMap } from "@/features/categories/queries";
import { getSettings } from "@/features/settings/queries";
import { coverUrl } from "@/features/books/cover";
import { DiscountBadge, StatusBadge } from "@/features/books/components/book-badges";
import { PriceTag } from "@/features/books/components/price-tag";
import { Rating } from "@/features/books/components/rating";
import { PreviewButton } from "@/features/books/components/preview-button";
import { ProductRow } from "@/features/books/components/product-row";
import { Gallery } from "@/features/book-detail/gallery";
import { ProductTabs, type Tab } from "@/features/book-detail/product-tabs";
import { ShareButton } from "@/features/book-detail/share-button";
import { StickyBuyBar } from "@/features/book-detail/sticky-buy-bar";
import { TrackSection } from "@/features/analytics/track-section";
import { BuyButton } from "@/features/whatsapp/buy-button";
import { toMessageBook } from "@/features/whatsapp/message";
import { ListButton } from "@/features/my-list/list-button";
import { BookViewTracker } from "@/features/my-list/recent-tracker";
import { ContinueBrowsing } from "@/features/my-list/continue-browsing";
import { Countdown } from "@/features/offers/countdown";
import { Breadcrumbs } from "@/features/seo/breadcrumbs";
import { JsonLd, bookJsonLd } from "@/features/seo/jsonld";
import { excerpt, pageMetadata } from "@/features/seo/metadata";
import { RichText } from "@/components/rich-text";
import { IconCheck, IconClock, IconStar, IconTruck } from "@/components/icons";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: "Not found", robots: { index: false } };
  const meta = await pageMetadata({
    path: `/books/${book.slug}`,
    item: book,
    title: `${book.title}${book.author ? ` by ${book.author}` : ""} (PDF)`,
    description: excerpt(`${book.subtitle ? `${book.subtitle}. ` : ""}${htmlToText(book.description)}`),
    type: "book",
  });
  // Without an admin share image, the dynamic opengraph-image file is used.
  return meta;
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) {
    const moved = await resolveOldBookSlug(slug);
    if (moved) permanentRedirect(`/books/${moved}`);
    notFound();
  }

  const [all, settings, reviews, catMap] = await Promise.all([getPublishedBooks(), getSettings(), getBookReviews(book.id), getCategorySlugMap()]);
  const symbol = settings.currency_symbol;
  const related = relatedBooks(book, all, 12);
  const msgBook = toMessageBook(book);
  const readerBook = { ...msgBook, page_count: book.page_count, preview_page_count: book.preview_page_count };
  const path = `/books/${book.slug}`;
  const catSlug = catMap.get(book.category);
  const catPath = catSlug ? `/category/${catSlug}` : "/shop";
  const offer = book.pricing.offer;
  const save = book.pricing.was != null ? book.pricing.was - book.pricing.final : 0;
  const hasPreview = Boolean(book.preview_path);
  const thumbs = book.preview_thumbs.map((t) => mediaUrl(t)!).filter(Boolean);

  const facts: [string, React.ReactNode][] = [
    ["Book ID", book.book_code],
    ["Author", book.author || null],
    ["Category", <Link key="c" href={catPath} className="link">{book.category}</Link>],
    ["Language", book.language],
    ["Pages", book.page_count],
    ["Format", book.format],
    ["File size", book.file_size],
    ["Released", book.release_date ? formatDate(book.release_date) : null],
    ["Free preview", book.preview_page_count ? `${book.preview_page_count} pages` : hasPreview ? "Yes" : null],
    ["Tags", book.tags.length ? book.tags.join(", ") : null],
  ];

  const tabs: Tab[] = [];
  if (book.description) tabs.push({ id: "description", label: "Description", content: <RichText html={book.description} className="max-w-3xl" /> });
  tabs.push({
    id: "details",
    label: "Details",
    content: (
      <table className="w-full max-w-2xl text-base">
        <tbody>
          {facts
            .filter(([, v]) => v != null && v !== "")
            .map(([k, v]) => (
              <tr key={k} className="border-b border-line last:border-0">
                <th scope="row" className="w-40 py-2.5 pr-4 text-left align-top font-medium text-text-3">
                  {k}
                </th>
                <td className="py-2.5 text-text">{v}</td>
              </tr>
            ))}
        </tbody>
      </table>
    ),
  });
  if (book.table_of_contents) {
    tabs.push({
      id: "contents",
      label: "Contents",
      content: (
        <ol className="max-w-2xl divide-y divide-line">
          {book.table_of_contents
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((line, i) => (
              <li key={i} lang={langOf(line)} className="py-2 text-base text-text-2">
                {line}
              </li>
            ))}
        </ol>
      ),
    });
  }
  if (reviews.length) {
    tabs.push({
      id: "reviews",
      label: `Reviews (${reviews.length})`,
      content: (
        <div className="max-w-3xl">
          {book.rating_count > 0 && (
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl font-bold">{Number(book.rating).toFixed(1)}</span>
              <Rating value={Number(book.rating)} count={book.rating_count} size={16} showValue={false} />
            </div>
          )}
          <ul className="divide-y divide-line">
            {reviews.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold">{r.author_name}</span>
                  <span className="flex text-star" aria-label={`${r.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <IconStar key={n} size={14} filled={n <= r.rating} className={n <= r.rating ? "" : "text-line-2"} />
                    ))}
                  </span>
                  <span className="text-sm text-text-3">{formatDate(r.review_date)}</span>
                </div>
                {r.body && (
                  <p lang={langOf(r.body)} className="mt-1.5 text-base whitespace-pre-line text-text-2">
                    {r.body}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  return (
    <>
      <JsonLd data={bookJsonLd(book)} />
      <BookViewTracker bookId={book.id} />

      <div className="container-x pt-4">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: book.category, path: catPath },
            { name: book.title, path },
          ]}
        />

        <article className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-6 rounded-lg border border-line bg-white p-4 md:p-6 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <TrackSection name={SECTIONS.detailGallery} as="div" bookId={book.id}>
            <Gallery
              book={readerBook}
              cover={coverUrl(book)}
              coverAlt={book.cover_alt}
              author={book.author}
              thumbs={thumbs}
              hasPreview={hasPreview}
              badges={<DiscountBadge pricing={book.pricing} symbol={symbol} />}
            />
          </TrackSection>

          <TrackSection name={SECTIONS.detailBuyBox} as="div" bookId={book.id} className="min-w-0">
            <StatusBadge badge={book.badge} />
            <h1 lang={langOf(book.title)} className="mt-1.5 text-xl leading-snug font-semibold md:text-2xl">
              {book.title}
            </h1>
            {book.subtitle && (
              <p lang={langOf(book.subtitle)} className="mt-1 text-base text-text-2">
                {book.subtitle}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
              {book.author && (
                <span className="text-text-3">
                  by{" "}
                  <Link href={`/shop?q=${encodeURIComponent(book.author)}`} className="font-medium text-text hover:text-brand">
                    {book.author}
                  </Link>
                </span>
              )}
              {book.rating_count > 0 && (
                <a href={reviews.length ? "#reviews" : undefined} className="hover:opacity-80">
                  <Rating value={Number(book.rating)} count={book.rating_count} />
                </a>
              )}
            </div>

            <div className="mt-4 rounded-md bg-muted px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <PriceTag pricing={book.pricing} symbol={symbol} size="lg" />
                <DiscountBadge pricing={book.pricing} symbol={symbol} />
              </div>
              {save > 0 && <p className="mt-1 text-sm font-medium text-sale">You save {formatPrice(save, symbol)}</p>}
              {offer?.end_at && offer.show_countdown && (
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-text-2">
                  <IconClock size={15} className="text-sale" />
                  {offer.title}: <Countdown endAt={offer.end_at} className="font-medium text-sale" />
                </p>
              )}
            </div>

            {book.highlights.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {book.highlights.slice(0, 5).map((h) => (
                  <li key={h} lang={langOf(h)} className="flex gap-2 text-base text-text-2">
                    <IconCheck size={18} className="mt-0.5 shrink-0 text-brand" />
                    {h}
                  </li>
                ))}
              </ul>
            )}

            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Format">
              {[book.format, book.page_count ? `${book.page_count} pages` : null, book.language, book.file_size]
                .filter(Boolean)
                .map((c) => (
                  <li key={c} className="rounded-full border border-line px-3 py-1 text-sm text-text-2">
                    {c}
                  </li>
                ))}
            </ul>

            <div id="buy-box" className="mt-5 flex flex-wrap gap-2">
              <BuyButton book={msgBook} section={SECTIONS.detailBuyBox} size="lg" className="w-full sm:w-auto sm:flex-1" />
              {hasPreview && <PreviewButton book={readerBook} className="btn-lg flex-1 sm:flex-none" />}
              <ListButton bookId={book.id} section={SECTIONS.detailBuyBox} className="btn-lg" />
              <ShareButton title={book.title} url={absoluteUrl(path)} bookId={book.id} />
            </div>

            <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-text-2">
              {settings.delivery_note && (
                <li className="flex items-center gap-2">
                  <IconTruck size={18} className="shrink-0 text-brand" />
                  {settings.delivery_note}
                </li>
              )}
              {settings.response_time && (
                <li className="flex items-center gap-2">
                  <IconClock size={18} className="shrink-0 text-brand" />
                  Reply within {settings.response_time}
                </li>
              )}
              <li className="flex items-center gap-2">
                <IconCheck size={18} className="shrink-0 text-brand" />
                <Link href="/how-to-order" className="hover:text-brand hover:underline">
                  How ordering works
                </Link>
              </li>
            </ul>
          </TrackSection>
        </article>

        <TrackSection name={SECTIONS.detailTabs} bookId={book.id} className="mt-6" aria-label="Book information">
          <ProductTabs tabs={tabs} />
        </TrackSection>
      </div>

      <ProductRow id="related-title" title="You may also like" books={related} symbol={symbol} section={SECTIONS.detailRelated} href={catPath} />
      <ContinueBrowsing excludeId={book.id} />
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <StickyBuyBar book={msgBook} targetId="buy-box" />
    </>
  );
}
