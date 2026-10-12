import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { SECTIONS } from "@/config/analytics";
import { isAutoCollectionSlug, AUTO_COLLECTION_SLUGS } from "@/config/site";
import { cn } from "@/lib/cn";
import { langOf } from "@/lib/bangla";
import { getPublishedBooks } from "@/features/books/queries";
import {
  autoCollectionBooks,
  autoCollectionMeta,
  getCollectionBySlug,
  resolveOldCollectionSlug,
} from "@/features/collections/queries";
import { getSettings } from "@/features/settings/queries";
import { BookGrid } from "@/features/books/components/book-grid";
import { BookRankRow } from "@/features/books/components/book-rank-row";
import { TrackSection } from "@/features/analytics/track-section";
import { Breadcrumbs } from "@/features/seo/breadcrumbs";
import { excerpt, pageMetadata } from "@/features/seo/metadata";
import { JsonLd, itemListJsonLd } from "@/features/seo/jsonld";
import { RichText } from "@/components/rich-text";
import type { BookCard } from "@/features/books/types";
import type { CollectionMood } from "@/lib/supabase/database.types";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

type View = {
  slug: string;
  name: string;
  intro: string;
  description: string;
  mood: CollectionMood;
  books: BookCard[];
  ranked: boolean;
};

async function load(slug: string): Promise<View | null> {
  if (isAutoCollectionSlug(slug)) {
    const meta = autoCollectionMeta(slug);
    const books = autoCollectionBooks(slug, await getPublishedBooks());
    return { slug, name: meta.name, intro: meta.description, description: "", mood: "paper", books, ranked: slug !== "latest" };
  }
  const c = await getCollectionBySlug(slug);
  if (!c) return null;
  return { slug: c.slug, name: c.name, intro: c.editorial_intro, description: c.description, mood: c.mood, books: c.books, ranked: false };
}

export async function generateStaticParams() {
  return AUTO_COLLECTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v = await load(slug);
  if (!v) return { title: "Collection not found", robots: { index: false } };
  return pageMetadata({
    title: `${v.name}: PDF books`,
    description: excerpt(v.description || v.intro || `${v.books.length} PDF books in the ${v.name} collection on eBoi.`),
    path: `/collections/${v.slug}`,
  });
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const v = await load(slug);
  if (!v) {
    const moved = await resolveOldCollectionSlug(slug);
    if (moved) permanentRedirect(`/collections/${moved}`);
    notFound();
  }
  const { currency_symbol: symbol } = await getSettings();
  const dark = v.mood === "forest";
  const path = `/collections/${v.slug}`;

  return (
    <>
      <JsonLd data={itemListJsonLd(v.name, path, v.books)} />
      <header className={cn(dark ? "bg-green-900 text-paper" : "", "pt-6 pb-12 md:pb-16")}>
        <div className="container-x">
          <div className={dark ? "[&_a]:text-green-100 [&_nav]:text-green-300" : undefined}>
            <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: v.name, path }]} />
          </div>
          <div className={cn("mt-8 grid gap-8 lg:grid-cols-12", v.mood === "ink" && "border-2 border-ink p-5 md:p-8", v.mood === "paper" && "rule-double pt-6")}>
            <div className="lg:col-span-6">
              <p className={cn("label", dark ? "text-green-300" : "text-ink-3")}>
                Collection · {v.books.length} {v.books.length === 1 ? "book" : "books"}
              </p>
              <h1 lang={langOf(v.name)} className="mt-3 text-mega font-semibold">
                {v.name}
              </h1>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 lg:self-end">
              {v.intro && (
                <p lang={langOf(v.intro)} className={cn("text-lead", dark ? "text-green-100" : "text-ink-2")}>
                  {v.intro}
                </p>
              )}
            </div>
          </div>
          {v.description && (
            <RichText text={v.description} className={cn("mt-8 md:columns-2 md:gap-10 lg:w-3/4", dark ? "text-green-100" : "text-ink-2")} />
          )}
        </div>
      </header>

      <TrackSection name={`${SECTIONS.collectionGrid}:${v.slug}`} className="container-x pb-20">
        {v.books.length === 0 ? (
          <p className="border-t-[3px] border-ink pt-6 text-lead text-ink-2">No books here yet. New ones are added every month.</p>
        ) : v.ranked ? (
          <ol className="grid gap-x-10 border-t-[3px] border-ink md:grid-cols-2">
            {v.books.map((b, i) => (
              <BookRankRow key={b.id} book={b} rank={i + 1} symbol={symbol} />
            ))}
          </ol>
        ) : (
          <BookGrid books={v.books} symbol={symbol} className="border-t-[3px] border-ink pt-10" priorityCount={4} />
        )}
      </TrackSection>
    </>
  );
}
