import Link from "next/link";
import type { ReactNode } from "react";
import { PAGE_SIZE, facets, filterBooks, sortBooks, toQuery, type CategorySlugMap, type ShopParams } from "@/features/books/catalog";
import type { BookCard } from "@/features/books/types";
import { BookGrid } from "@/features/books/components/book-grid";
import { ProductRow } from "@/features/books/components/product-row";
import { TrackSection } from "@/features/analytics/track-section";
import { TrackOnMount } from "@/features/analytics/site-trackers";
import { SECTIONS } from "@/config/analytics";
import { IconSearch } from "@/components/icons";
import { FilterPanel, type FacetData } from "./filter-panel";
import { SortSelect } from "./sort-select";
import { MobileFilters } from "./mobile-filters";
import { ActiveChips, buildChips } from "./active-chips";

type Props = {
  /** The books this page lists before filters (all books, one category, one collection). */
  scope: BookCard[];
  params: ShopParams;
  basePath: string;
  title: string;
  /** Shown under the title (collection intro and similar). */
  intro?: ReactNode;
  /** Longer text shown under the results (collection descriptions). */
  after?: ReactNode;
  breadcrumbs: ReactNode;
  catMap: CategorySlugMap;
  symbol: string;
  section: string;
  /** Keep the scope's own order when no sort is chosen (manual collections, charts). */
  keepOrder?: boolean;
  hideCategory?: boolean;
  offerTitle?: string;
  /** Books outside this listing; a short or empty result list is followed by a row of them. */
  others?: BookCard[];
};

/**
 * Standard listing layout: breadcrumbs, title and count, filter sidebar on
 * desktop (drawer on phones), sort, removable filter chips, product grid
 * and "Show more". Facet counts ignore their own group, so picking one
 * language still shows how many books the other languages have.
 */
export function CatalogView(p: Props) {
  const { params, scope, catMap } = p;
  const results = filterBooks(scope, params, catMap);
  const sorted = p.keepOrder && !params.sort && !params.q ? results : sortBooks(results, params.sort ?? "relevance", params.q);
  const pageNum = params.page ?? 1;
  const shown = sorted.slice(0, pageNum * PAGE_SIZE);

  const without = (next: Partial<ShopParams>) => filterBooks(scope, { ...params, ...next }, catMap);
  const f: FacetData = {
    categories: facets(without({ category: [] }), catMap).categories,
    languages: facets(without({ language: [] }), catMap).languages,
    formats: facets(without({ format: [] }), catMap).formats,
    deals: facets(without({ deals: undefined }), catMap).deals,
    minPrice: facets(scope, catMap).minPrice,
    maxPrice: facets(scope, catMap).maxPrice,
  };

  const nameBySlug = new Map([...catMap.entries()].map(([n, s]) => [s, n]));
  const chips = buildChips(params, p.basePath, (s) => nameBySlug.get(s) ?? s, p.symbol, p.offerTitle);
  const clearHref = `${p.basePath}${toQuery({ q: params.q, sort: params.sort })}`;
  const active = chips.length - (params.q ? 1 : 0);
  const panel = (idPrefix: string) => (
    <FilterPanel params={params} facets={f} basePath={p.basePath} symbol={p.symbol} hideCategory={p.hideCategory} idPrefix={idPrefix} />
  );
  const chipRow = <ActiveChips chips={chips} clearHref={clearHref} />;

  const filterTerm = [
    params.category.length && `category:${params.category.join("+")}`,
    params.language.length && `language:${params.language.join("+")}`,
    (params.min != null || params.max != null) && `price:${params.min ?? ""}-${params.max ?? ""}`,
    params.deals && "deals",
  ]
    .filter(Boolean)
    .join("|");

  const shownIds = new Set(results.map((b) => b.id));
  const more = results.length < 8 ? (p.others ?? []).filter((b) => !shownIds.has(b.id)).sort((a, b) => b.total_sells - a.total_sells).slice(0, 12) : [];

  return (
    <>
    <div className={more.length ? "container-x pt-4" : "container-x pt-4 pb-10"}>
      {p.breadcrumbs}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-semibold md:text-2xl">{p.title}</h1>
        <p className="text-sm text-text-3" aria-live="polite">
          {results.length} {results.length === 1 ? "book" : "books"}
        </p>
      </div>
      {p.intro && <div className="mt-2 max-w-3xl">{p.intro}</div>}

      <div className="mt-5 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filters">
          <TrackSection name={SECTIONS.shopFilters} as="div" className="sticky top-24 rounded-lg border border-line bg-white p-4">
            {panel("side")}
          </TrackSection>
        </aside>

        <TrackSection name={p.section} className="min-w-0" aria-label="Results">
          <div className="flex items-center justify-between gap-3">
            <MobileFilters activeCount={active} resultCount={results.length} chips={chipRow}>
              {panel("drawer")}
            </MobileFilters>
            <div className="ml-auto">
              <SortSelect params={params} basePath={p.basePath} />
            </div>
          </div>
          {chips.length > 0 && <div className="mt-3">{chipRow}</div>}

          {results.length ? (
            <>
              <BookGrid books={shown} symbol={p.symbol} section={p.section} withSidebar className="mt-4" priorityCount={4} />
              {shown.length < results.length && (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <p className="text-sm text-text-3">
                    Showing {shown.length} of {results.length}
                  </p>
                  <Link href={`${p.basePath}${toQuery({ ...params, page: pageNum + 1 })}`} scroll={false} className="btn btn-secondary">
                    Show more
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 flex flex-col items-center rounded-lg border border-line bg-white px-6 py-12 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-muted text-text-3">
                <IconSearch size={22} />
              </span>
              <p className="mt-3 text-md font-semibold">No books found</p>
              <Link href={params.q ? "/shop" : clearHref} className="btn btn-primary mt-4">
                {params.q ? "See all books" : "Clear filters"}
              </Link>
            </div>
          )}
        </TrackSection>
      </div>

      {p.after && <div className="mt-8 rounded-lg border border-line bg-white p-5 md:p-6">{p.after}</div>}

      {params.q && <TrackOnMount type="search" term={params.q} resultCount={results.length} section={SECTIONS.shopSearch} />}
      {filterTerm && <TrackOnMount type="filter" term={filterTerm.slice(0, 80)} resultCount={results.length} section={SECTIONS.shopFilters} />}
    </div>
    {more.length > 0 && (
      <ProductRow id="more-title" title={results.length ? "More books you may like" : "Popular books"} books={more} symbol={p.symbol} section={SECTIONS.detailRelated} href="/collections/best-selling" />
    )}
    </>
  );
}
