import type { Metadata } from "next";
import { SECTIONS } from "@/config/analytics";
import { getPublishedBooks } from "@/features/books/queries";
import { parseShopParams } from "@/features/books/catalog";
import { getCategorySlugMap } from "@/features/categories/queries";
import { getSettings } from "@/features/settings/queries";
import { getLiveOffers } from "@/features/offers/queries";
import { CatalogView } from "@/features/shop/catalog-view";
import { pageMetadata } from "@/features/seo/metadata";
import { Breadcrumbs } from "@/features/seo/breadcrumbs";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = parseShopParams(await searchParams);
  const filtered = Boolean(p.q || p.category.length || p.language.length || p.format.length || p.min != null || p.max != null || p.deals || p.offer || p.sort || p.page);
  // Filtered and searched pages are not indexed; the canonical points at /shop.
  return pageMetadata({
    page: "shop",
    path: "/shop",
    title: p.q ? `Search: ${p.q}` : "All PDF books",
    noindex: filtered,
  });
}

export default async function ShopPage({ searchParams }: Props) {
  const params = parseShopParams(await searchParams);
  const [books, catMap, settings, offers] = await Promise.all([getPublishedBooks(), getCategorySlugMap(), getSettings(), getLiveOffers()]);
  const offer = params.offer ? offers.find((o) => o.id === params.offer) : undefined;
  const title = params.q ? `Results for “${params.q}”` : offer ? offer.title : params.deals ? "Books on offer" : "All books";

  return (
    <CatalogView
      scope={books}
      others={books}
      params={params}
      basePath="/shop"
      title={title}
      intro={offer?.banner_text ? <p className="text-base text-text-2">{offer.banner_text}</p> : undefined}
      breadcrumbs={<Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }]} />}
      catMap={catMap}
      symbol={settings.currency_symbol}
      section={SECTIONS.shopResults}
      offerTitle={offer?.title}
    />
  );
}
