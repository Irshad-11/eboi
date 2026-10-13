import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { SECTIONS } from "@/config/analytics";
import { absoluteUrl } from "@/lib/env";
import { formatCompact, formatDate, formatPrice } from "@/lib/format";
import { langOf } from "@/lib/bangla";
import { mediaUrl } from "@/lib/media";
import { htmlToText } from "@/lib/rich-text";
import { categoryRank, getBookBySlug, getBookReviews, getPublishedBooks, relatedBooks, resolveOldBookSlug } from "@/features/books/queries";
import { getCategorySlugMap } from "@/features/categories/queries";
import { getSettings } from "@/features/settings/queries";
import { coverUrl } from "@/features/books/cover";
import { DiscountBadge, StatusBadge } from "@/features/books/components/book-badges";
import { PriceTag } from "@/features/books/components/price-tag";
import { BookCover } from "@/features/books/components/book-cover";
import { Rating } from "@/features/books/components/rating";
import { PreviewButton } from "@/features/books/components/preview-button";
import { ProductRow } from "@/features/books/components/product-row";
import { Gallery } from "@/features/book-detail/gallery";
import { ProductTabs, type Tab } from "@/features/book-detail/product-tabs";
import { ShareButton } from "@/features/book-detail/share-button";
import { StickyBuyBar } from "@/features/book-detail/sticky-buy-bar";
import { TrackSection } from "@/features/analytics/track-section";
import { BundleButton, BuyButton } from "@/features/whatsapp/buy-button";
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
  const f = settings.features;
  const rank = f.category_rank ? categoryRank(book, all) : null;
  const byAuthor = f.more_by_author && book.author ? all.filter((b) => b.author === book.author && b.id !== book.id).slice(0, 12) : [];
  // Buy together: this book plus the two closest matches that are not already in the author row.
  const bundle = f.bundle ? [book, ...related.filter((b) => !byAuthor.some((a) => a.id === b.id)).slice(0, 2)] : [];
  const bundleTotal = bundle.reduce((n, b) => n + b.pricing.final, 0);
  const bundleWas = bundle.reduce((n, b) => n + (b.pricing.was ?? b.pricing.final), 0);
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
              {f.sold_count && book.total_sells > 0 && <span className="text-sm text-text-2 tnum">{formatCompact(book.total_sells)} sold</span>}
            </div>
            {rank && (
              <Link href={catPath} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fff4e0] px-2.5 py-1 text-sm font-semibold text-[#8a4b00] hover:underline">
                <IconStar size={14} className="text-star" />#{rank} in {book.category}
              </Link>
            )}

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

            {f.tag_chips && book.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-sm text-text-3">Topics:</span>
                {book.tags.slice(0, 8).map((t) => (
                  <Link key={t} href={`/shop?q=${encodeURIComponent(t)}`} lang={langOf(t)} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-sm text-brand-ink hover:bg-brand hover:text-white">
                    {t}
                  </Link>
                ))}
              </div>
            )}

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

        {bundle.length >= 2 && (
          <section className="mt-6 rounded-lg border border-line bg-white p-4 md:p-6" aria-labelledby="bundle-title">
            <h2 id="bundle-title" className="text-md font-semibold">
              Buy together
            </h2>
            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center">
              <ul className="grid flex-1 grid-cols-3 gap-5 sm:gap-8">
                {bundle.map((b, i) => (
                  <li key={b.id} className="relative min-w-0">
                    {i > 0 && (
                      <span className="absolute top-[30%] -left-2.5 -translate-x-1/2 text-xl font-semibold text-text-3 sm:-left-4" aria-hidden="true">
                        +
                      </span>
                    )}
                    <Link href={`/books/${b.slug}`} className="group block min-w-0">
                      <BookCover src={coverUrl(b)} alt={b.cover_alt} title={b.title} author={b.author} sizes="120px" className="mx-auto max-w-[7.5rem]" />
                      <p lang={langOf(b.title)} className="mt-1.5 line-clamp-2 text-center text-sm leading-snug font-medium group-hover:text-brand">
                        {i === 0 ? "This book" : b.title}
                      </p>
                      <div className="flex justify-center">
                        <PriceTag pricing={b.pricing} symbol={symbol} size="sm" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="rounded-md bg-muted p-4 md:w-72">
                <p className="text-sm text-text-2">Total for {bundle.length} books</p>
                <p className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-text tnum">{formatPrice(bundleTotal, symbol)}</span>
                  {bundleWas > bundleTotal && <span className="price-was text-sm">{formatPrice(bundleWas, symbol)}</span>}
                </p>
                <BundleButton books={bundle.map(toMessageBook)} section={SECTIONS.detailBuyBox} className="btn-block mt-3" />
              </div>
            </div>
          </section>
        )}

        <TrackSection name={SECTIONS.detailTabs} bookId={book.id} className="mt-6" aria-label="Book information">
          <ProductTabs tabs={tabs} />
        </TrackSection>
      </div>

      {byAuthor.length > 0 && (
        <ProductRow
          id="author-title"
          title={`More by ${book.author}`}
          books={byAuthor}
          symbol={symbol}
          section={SECTIONS.detailRelated}
          href={`/shop?q=${encodeURIComponent(book.author)}`}
        />
      )}
      <ProductRow id="related-title" title="You may also like" books={related} symbol={symbol} section={SECTIONS.detailRelated} href={catPath} />
      <ContinueBrowsing excludeId={book.id} />
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <StickyBuyBar book={msgBook} targetId="buy-box" />
    </>
  );
}
