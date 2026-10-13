import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { SECTIONS } from "@/config/analytics";
import { AUTO_COLLECTION_SLUGS, isAutoCollectionSlug } from "@/config/site";
import { htmlToText } from "@/lib/rich-text";
import { getPublishedBooks } from "@/features/books/queries";
import { parseShopParams } from "@/features/books/catalog";
import { getCategorySlugMap } from "@/features/categories/queries";
import {
  autoCollectionBooks,
  autoCollectionMeta,
  getCollectionBySlug,
  resolveOldCollectionSlug,
  type CollectionWithBooks,
} from "@/features/collections/queries";
import { getSettings } from "@/features/settings/queries";
import { CatalogView } from "@/features/shop/catalog-view";
import { Breadcrumbs } from "@/features/seo/breadcrumbs";
import { excerpt, pageMetadata } from "@/features/seo/metadata";
import { JsonLd, itemListJsonLd } from "@/features/seo/jsonld";
import { RichText } from "@/components/rich-text";
import type { BookCard } from "@/features/books/types";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

type View = { slug: string; name: string; intro: string; description: string; books: BookCard[]; custom: CollectionWithBooks | null };

async function load(slug: string): Promise<View | null> {
  if (isAutoCollectionSlug(slug)) {
    const meta = autoCollectionMeta(slug);
    return { slug, name: meta.name, intro: "", description: "", books: autoCollectionBooks(slug, await getPublishedBooks()), custom: null };
  }
  const c = await getCollectionBySlug(slug);
  if (!c) return null;
  return { slug: c.slug, name: c.name, intro: c.editorial_intro, description: c.description, books: c.books, custom: c };
}

export async function generateStaticParams() {
  return AUTO_COLLECTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v = await load(slug);
  if (!v) return { title: "Not found", robots: { index: false } };
  const sp = parseShopParams(await searchParams);
  const filtered = Boolean(sp.q || sp.category.length || sp.language.length || sp.min != null || sp.max != null || sp.deals || sp.sort || sp.page);
  return pageMetadata({
    path: `/collections/${v.slug}`,
    item: v.custom,
    title: `${v.name}: PDF books`,
    description: excerpt(v.intro || htmlToText(v.description) || `${v.books.length} PDF books in ${v.name}.`),
    noindex: filtered,
  });
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const v = await load(slug);
  if (!v) {
    const moved = await resolveOldCollectionSlug(slug);
    if (moved) permanentRedirect(`/collections/${moved}`);
    notFound();
  }
  const sp = parseShopParams(await searchParams);
  const [catMap, settings, all] = await Promise.all([getCategorySlugMap(), getSettings(), getPublishedBooks()]);
  const path = `/collections/${v.slug}`;

  return (
    <>
      <JsonLd data={itemListJsonLd(v.name, path, v.books)} />
      <CatalogView
        scope={v.books}
        others={all}
        params={sp}
        basePath={path}
        title={v.name}
        intro={v.intro ? <p className="text-base text-text-2">{v.intro}</p> : undefined}
        after={v.description ? <RichText html={v.description} className="text-base" /> : undefined}
        breadcrumbs={<Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: v.name, path }]} />}
        catMap={catMap}
        symbol={settings.currency_symbol}
        section={`${SECTIONS.collectionGrid}:${v.slug}`}
        keepOrder
      />
    </>
  );
}
