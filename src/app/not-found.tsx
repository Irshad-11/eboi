import Link from "next/link";
import type { Metadata } from "next";
import { SECTIONS } from "@/config/analytics";
import { SiteChrome } from "@/features/layout/site-chrome";
import { getPublishedBooks } from "@/features/books/queries";
import { getSettings } from "@/features/settings/queries";
import { ProductRow } from "@/features/books/components/product-row";
import { SearchBox } from "@/features/layout/search-box";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** 404 with search and popular books instead of a dead end. */
export default async function NotFound() {
  const [books, settings] = await Promise.all([getPublishedBooks(), getSettings()]);
  const popular = [...books].sort((a, b) => b.total_sells - a.total_sells).slice(0, 12);
  return (
    <SiteChrome>
      <section className="container-x pt-10">
        <div className="mx-auto max-w-xl rounded-lg border border-line bg-white p-6 text-center md:p-10">
          <p className="text-sm font-semibold text-text-3">404</p>
          <h1 className="mt-1 text-xl font-semibold md:text-2xl">Page not found</h1>
          <SearchBox className="mt-5 text-left" />
          <Link href="/" className="btn btn-secondary mt-4">
            Go to home page
          </Link>
        </div>
      </section>
      <ProductRow id="popular-title" title="Popular books" books={popular} symbol={settings.currency_symbol} section={SECTIONS.notFound} href="/collections/best-selling" />
    </SiteChrome>
  );
}
