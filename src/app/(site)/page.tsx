import type { Metadata } from "next";
import { SECTIONS, collectionSection } from "@/config/analytics";
import { HOME } from "@/config/site";
import { htmlToText } from "@/lib/rich-text";
import { getBookBySlug, getPublishedBooks } from "@/features/books/queries";
import { sortBooks } from "@/features/books/catalog";
import { getCollections, autoCollectionBooks } from "@/features/collections/queries";
import { getCategories } from "@/features/categories/queries";
import { getBanners } from "@/features/banners/queries";
import { getLiveOffers } from "@/features/offers/queries";
import { getSettings, fillTokens } from "@/features/settings/queries";
import { HeroSection } from "@/features/home/hero-section";
import { CategoryShortcuts } from "@/features/home/category-shortcuts";
import { OffersSection } from "@/features/home/offers-section";
import { JourneySection } from "@/features/home/journey-section";
import { FaqSection } from "@/features/home/faq-section";
import { ProductRow } from "@/features/books/components/product-row";
import { FeaturedCard } from "@/features/books/components/featured-card";
import { CollectionLead, CollectionTile } from "@/features/books/components/collection-tile";
import { ContinueBrowsing } from "@/features/my-list/continue-browsing";
import { TrackSection } from "@/features/analytics/track-section";
import { SectionHead } from "@/components/section-head";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/features/seo/jsonld";
import { pageMetadata } from "@/features/seo/metadata";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ page: "home", path: "/" });
}

export default async function HomePage() {
  const [books, collections, offers, settings, banners, categories] = await Promise.all([
    getPublishedBooks(),
    getCollections(),
    getLiveOffers(),
    getSettings(),
    getBanners(),
    getCategories(),
  ]);
  const symbol = settings.currency_symbol;
  const byNewest = sortBooks(books, "newest");
  const newestCard = byNewest[0] ?? null;
  const newest = newestCard ? await getBookBySlug(newestCard.slug) : null;
  const homeCollections = collections.filter((c) => c.show_on_home && c.books.length > 0);
  const steps = settings.how_to_buy_steps.map((s) => ({ title: fillTokens(s.title, settings), body: fillTokens(s.body, settings) }));

  const render = (type: string) => {
    switch (type) {
      case "hero":
        return <HeroSection key="hero" banners={banners} />;
      case "categories":
        return <CategoryShortcuts key="categories" categories={categories} />;
      case "offers":
        return <OffersSection key="offers" offers={offers} books={books} collections={collections} symbol={symbol} />;
      case "newest":
        return newestCard ? (
          <TrackSection key="newest" name={SECTIONS.newest} bookId={newestCard.id} className="container-x py-4 md:py-5" aria-labelledby="newest-title">
            <SectionHead id="newest-title" title="Newest book" href="/collections/latest" linkLabel="All new arrivals" />
            <FeaturedCard book={newestCard} symbol={symbol} section={SECTIONS.newest} summary={htmlToText(newest?.description).slice(0, 400)} />
          </TrackSection>
        ) : null;
      case "best_selling":
        return (
          <ProductRow
            key="best"
            id="best-title"
            title="Best selling"
            books={autoCollectionBooks("best-selling", books).slice(0, HOME.rowCount)}
            symbol={symbol}
            section={SECTIONS.bestSelling}
            href="/collections/best-selling"
          />
        );
      case "latest":
        return (
          <ProductRow
            key="latest"
            id="latest-title"
            title="New arrivals"
            books={byNewest.slice(0, HOME.rowCount)}
            symbol={symbol}
            section={SECTIONS.latest}
            href="/collections/latest"
          />
        );
      case "collections":
        return homeCollections.map((c) => (
          <ProductRow
            key={`c-${c.id}`}
            id={`c-${c.slug}`}
            title={c.name}
            books={c.books.slice(0, HOME.collectionRowCount)}
            symbol={symbol}
            section={collectionSection(c.slug)}
            href={`/collections/${c.slug}`}
            lead={<CollectionLead slug={c.slug} intro={c.editorial_intro} mood={c.mood} books={c.books} symbol={symbol} />}
          />
        ));
      case "collection_tiles":
        return collections.filter((c) => c.books.length).length ? (
          <TrackSection key="tiles" name={SECTIONS.collectionTiles} className="container-x py-4 md:py-5" aria-labelledby="tiles-title">
            <SectionHead id="tiles-title" title="Collections" />
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {collections
                .filter((c) => c.books.length)
                .map((c) => (
                  <li key={c.id}>
                    <CollectionTile name={c.name} slug={c.slug} imagePath={c.image_path} books={c.books} />
                  </li>
                ))}
            </ul>
          </TrackSection>
        ) : null;
      case "recent":
        return <ContinueBrowsing key="recent" />;
      case "journey":
        return <JourneySection key="journey" steps={steps} />;
      case "faq":
        return <FaqSection key="faq" items={settings.faq_items} />;
      default:
        return null;
    }
  };

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />
      <h1 className="sr-only">
        {settings.site_name}
        {settings.tagline ? `: ${settings.tagline}` : ""}
      </h1>
      <div className="pb-4">{settings.home_sections.filter((s) => s.enabled).map((s) => render(s.type))}</div>
    </>
  );
}
