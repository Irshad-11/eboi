import { HOME } from "@/config/site";
import { getPublishedBooks } from "@/features/books/queries";
import { sortBooks } from "@/features/books/catalog";
import { getCollections, autoCollectionBooks } from "@/features/collections/queries";
import { getLiveOffers } from "@/features/offers/queries";
import { getSettings } from "@/features/settings/queries";
import { FrontPage } from "@/features/home/front-page";
import { OffersSection } from "@/features/home/offers-section";
import { BestSelling } from "@/features/home/best-selling";
import { LatestShelf } from "@/features/home/latest-shelf";
import { CollectionFeature } from "@/features/home/collection-feature";
import { HowItWorks } from "@/features/home/how-it-works";
import { AboutTeaser } from "@/features/home/about-teaser";
import { ContinueBrowsing } from "@/features/my-list/continue-browsing";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/features/seo/jsonld";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

export default async function HomePage() {
  const [books, collections, offers, settings] = await Promise.all([
    getPublishedBooks(),
    getCollections(),
    getLiveOffers(),
    getSettings(),
  ]);
  const symbol = settings.currency_symbol;
  const byNewest = sortBooks(books, "newest");
  const newest = byNewest[0] ?? null;
  const featured = books.filter((b) => b.is_featured && b.id !== newest?.id).slice(0, 2);
  const bestSelling = autoCollectionBooks("best-selling", books).slice(0, HOME.bestSellingCount);
  const latest = byNewest.slice(1, 1 + HOME.latestCount);
  const homeCollections = collections.filter((c) => c.show_on_home && c.books.length > 0);

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd()]} />
      <FrontPage newest={newest} featured={featured} bookCount={books.length} symbol={symbol} />
      <OffersSection offers={offers} books={books} collections={collections} symbol={symbol} />
      <BestSelling books={bestSelling} symbol={symbol} />
      <LatestShelf books={latest} symbol={symbol} />
      {homeCollections.slice(0, 1).map((c) => (
        <CollectionFeature key={c.id} collection={c} symbol={symbol} />
      ))}
      <ContinueBrowsing />
      {homeCollections.slice(1).map((c) => (
        <CollectionFeature key={c.id} collection={c} symbol={symbol} />
      ))}
      <HowItWorks steps={settings.how_to_buy_steps} deliveryNote={settings.delivery_note} whatsappNumber={settings.whatsapp_number} />
      <AboutTeaser about={settings.about_content} />
    </>
  );
}
