import Link from "next/link";
import type { Metadata } from "next";
import { SECTIONS } from "@/config/analytics";
import { AUTO_COLLECTIONS } from "@/config/site";
import { getPublishedBooks } from "@/features/books/queries";
import { facets, filterBooks, parseShopParams, shopHref, sortBooks, SORTS } from "@/features/books/catalog";
import { getCollections } from "@/features/collections/queries";
import { getSettings } from "@/features/settings/queries";
import { getLiveOffers } from "@/features/offers/queries";
import { BookGrid } from "@/features/books/components/book-grid";
import { TrackSection } from "@/features/analytics/track-section";
import { TrackOnMount } from "@/features/analytics/site-trackers";
import { FilterForm } from "@/features/shop/filter-form";
import { MobileFilters } from "@/features/shop/mobile-filters";
import { pageMetadata } from "@/features/seo/metadata";
import { Breadcrumbs } from "@/features/seo/breadcrumbs";
import { IconSearch } from "@/components/icons";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const PAGE_SIZE = 48;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = parseShopParams(await searchParams);
  const meta = pageMetadata({
    title: p.q ? `Search: ${p.q}` : p.category ? `${p.category} PDF books` : "All PDF books",
    description: "Every eBoi PDF in one place. Search by title, author or Book ID, filter by category, language and price.",
    path: "/shop",
  });
  // Filtered and searched pages point Google at the main shop page.
  if (p.q || p.min != null || p.max != null || p.offer || p.sort) meta.robots = { index: false, follow: true };
  return meta;
}

export default async function ShopPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params = parseShopParams(raw);
  const pageNum = Math.max(1, Math.min(50, Number(raw.page) || 1));

  const [all, collections, settings, offers] = await Promise.all([
    getPublishedBooks(),
    getCollections(),
    getSettings(),
    getLiveOffers(),
  ]);
  const symbol = settings.currency_symbol;
  const results = sortBooks(filterBooks(all, params), params.sort);
  const shown = results.slice(0, pageNum * PAGE_SIZE);
  const f = facets(all);
  const offer = params.offer ? offers.find((o) => o.id === params.offer) : undefined;

  const active = [params.category, params.language, params.min != null, params.max != null, params.sort, params.offer].filter(Boolean).length;
  const filterTerm = [
    params.category && `category:${params.category}`,
    params.language && `language:${params.language}`,
    (params.min != null || params.max != null) && `price:${params.min ?? ""}-${params.max ?? ""}`,
    params.sort && `sort:${params.sort}`,
  ]
    .filter(Boolean)
    .join("|");

  const heading = params.q ? `Results for “${params.q}”` : offer ? offer.title : (params.category ?? "All books");
  const formProps = { params, categories: f.categories, languages: f.languages, minPrice: f.minPrice, maxPrice: f.maxPrice, symbol };

  return (
    <div className="container-x pt-6 pb-20">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }]} />

      <header className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="label text-ink-3">The shop</p>
          <h1 className="mt-2 text-display font-semibold">{heading}</h1>
          {offer?.banner_text && <p className="mt-3 text-lead text-ochre-ink">{offer.banner_text}</p>}
        </div>
        <TrackSection name={SECTIONS.shopSearch} as="div" className="lg:col-span-5">
          <form action="/shop" method="get" role="search" id="search" className="flex scroll-mt-6 gap-2">
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.language && <input type="hidden" name="language" value={params.language} />}
            <label htmlFor="shop-q" className="sr-only">
              Search books
            </label>
            <input id="shop-q" name="q" type="search" defaultValue={params.q ?? ""} placeholder="Title, author or Book ID" className="input" enterKeyHint="search" />
            <button className="btn btn-primary shrink-0 px-4" aria-label="Search">
              <IconSearch />
            </button>
          </form>
        </TrackSection>
      </header>

      {/* Category and collection navigation: dense, like a bookshop's signage. */}
      <nav aria-label="Collections" className="mt-8 border-y border-ink py-3">
        <ul className="flex flex-wrap gap-x-1 gap-y-1">
          {Object.entries(AUTO_COLLECTIONS).map(([slug, c]) => (
            <li key={slug}>
              <Link href={`/collections/${slug}`} className="inline-flex min-h-10 items-center px-2.5 text-small font-semibold hover:bg-paper-2">
                {c.name}
              </Link>
            </li>
          ))}
          {collections.filter((c) => c.books.length).map((c) => (
            <li key={c.id}>
              <Link href={`/collections/${c.slug}`} className="inline-flex min-h-10 items-center px-2.5 text-small hover:bg-paper-2">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <TrackSection name={SECTIONS.shopFilters} as="div" className="sticky top-6">
            <FilterForm idPrefix="d-" {...formProps} />
          </TrackSection>
        </aside>

        <TrackSection name={SECTIONS.shopResults} className="lg:col-span-9" aria-label="Results">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink pb-3">
            <p className="label tnum" aria-live="polite">
              {results.length} {results.length === 1 ? "book" : "books"}
              {params.sort ? <span className="text-ink-3"> · {SORTS[params.sort]}</span> : null}
            </p>
            <MobileFilters activeCount={active}>
              <FilterForm idPrefix="m-" {...formProps} />
            </MobileFilters>
          </div>

          {results.length ? (
            <>
              <BookGrid books={shown} symbol={symbol} cols={4} className="mt-8" priorityCount={4} />
              {shown.length < results.length && (
                <div className="mt-12 text-center">
                  <Link href={`${shopHref(params)}${shopHref(params).includes("?") ? "&" : "?"}page=${pageNum + 1}`} scroll={false} className="btn btn-outline">
                    Show more books ({results.length - shown.length} left)
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="mt-10 max-w-xl">
              <p className="text-headline font-semibold">Nothing on the shelf matches that.</p>
              <p className="mt-3 text-ink-2">
                Try fewer words, the author&apos;s name, or a Book ID like EB-0001. Or ask on WhatsApp: if we have it, we will tell you.
              </p>
              <Link href="/shop" className="btn btn-outline mt-6">
                See all books
              </Link>
            </div>
          )}
        </TrackSection>
      </div>

      {params.q && <TrackOnMount type="search" term={params.q} resultCount={results.length} section={SECTIONS.shopSearch} />}
      {filterTerm && <TrackOnMount type="filter" term={filterTerm.slice(0, 80)} resultCount={results.length} section={SECTIONS.shopFilters} />}
    </div>
  );
}
