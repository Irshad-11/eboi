import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SECTIONS } from "@/config/analytics";
import { getPublishedBooks } from "@/features/books/queries";
import { parseShopParams } from "@/features/books/catalog";
import { getCategories } from "@/features/categories/queries";
import { getSettings } from "@/features/settings/queries";
import { CatalogView } from "@/features/shop/catalog-view";
import { pageMetadata } from "@/features/seo/metadata";
import { Breadcrumbs } from "@/features/seo/breadcrumbs";
import { JsonLd, itemListJsonLd } from "@/features/seo/jsonld";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function load(slug: string) {
  const cats = await getCategories();
  return { cat: cats.find((c) => c.slug === slug) ?? null, cats };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { cat } = await load(slug);
  if (!cat) return { title: "Not found", robots: { index: false } };
  const sp = parseShopParams(await searchParams);
  const filtered = Boolean(sp.q || sp.language.length || sp.format.length || sp.min != null || sp.max != null || sp.deals || sp.sort || sp.page);
  return pageMetadata({
    path: `/category/${cat.slug}`,
    title: `${cat.name} PDF books`,
    description: `${cat.count} ${cat.name} PDF books. Read a free preview and order on WhatsApp.`,
    noindex: filtered,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { cat, cats } = await load(slug);
  if (!cat) notFound();
  const sp = parseShopParams(await searchParams);
  sp.category = [];
  const [books, settings] = await Promise.all([getPublishedBooks(), getSettings()]);
  const scope = books.filter((b) => b.category === cat.name);
  const path = `/category/${cat.slug}`;
  return (
    <>
      <JsonLd data={itemListJsonLd(cat.name, path, scope)} />
      <CatalogView
        scope={scope}
        others={books}
        params={sp}
        basePath={path}
        title={cat.name}
        breadcrumbs={<Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: cat.name, path }]} />}
        catMap={new Map(cats.map((c) => [c.name, c.slug]))}
        symbol={settings.currency_symbol}
        section={SECTIONS.categoryGrid}
        hideCategory
      />
    </>
  );
}
