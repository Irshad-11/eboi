import Link from "next/link";
import { SECTIONS } from "@/config/analytics";
import { getPublishedBooks } from "@/features/books/queries";
import { getSettings } from "@/features/settings/queries";
import { ProductRow } from "@/features/books/components/product-row";
import { SearchBox } from "./search-box";

/**
 * The 404 body: search and popular books instead of a dead end. It renders
 * without the header and footer, so the layout that already has them (the
 * shop pages) can use it as is and only the root 404 adds the site chrome.
 */
export async function NotFoundView() {
  const [books, settings] = await Promise.all([getPublishedBooks(), getSettings()]);
  const popular = [...books].sort((a, b) => b.total_sells - a.total_sells).slice(0, 12);
  return (
    <>
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
    </>
  );
}
