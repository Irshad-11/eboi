import type { Metadata } from "next";
import { getPublishedBooks, toLite } from "@/features/books/queries";
import { autoCollectionBooks } from "@/features/collections/queries";
import { getSettings } from "@/features/settings/queries";
import { ProductRow } from "@/features/books/components/product-row";
import { SECTIONS } from "@/config/analytics";
import { HOME } from "@/config/site";
import { PageHeader } from "@/components/page-header";
import { ListWithSend, MyListView } from "@/features/my-list/my-list-view";
import { ContinueBrowsing } from "@/features/my-list/continue-browsing";

export const metadata: Metadata = {
  title: "My List",
  alternates: { canonical: "/my-list" },
  // Personal, per-browser content.
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ books?: string }> };

export default async function MyListPage({ searchParams }: Props) {
  const { books: codesParam } = await searchParams;
  const codes = (codesParam ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^EB-\d{4,}$/.test(c))
    .slice(0, 30);

  // A list link from a WhatsApp message (?books=EB-0001,EB-0004) shows exactly those books.
  if (codes.length) {
    const byCode = new Map((await getPublishedBooks()).map((b) => [b.book_code, b]));
    const shared = codes.flatMap((c) => (byCode.has(c) ? [toLite(byCode.get(c)!)] : []));
    return (
      <>
        <PageHeader title="Shared list" path="/my-list" crumb="My List" />
        <section className="container-x mt-4">
          <ListWithSend books={shared} />
        </section>
      </>
    );
  }

  const [all, settings] = await Promise.all([getPublishedBooks(), getSettings()]);
  return (
    <>
      <PageHeader title="My List" path="/my-list" crumb="My List" />
      <section className="container-x mt-4">
        <MyListView />
      </section>
      <ContinueBrowsing />
      <ProductRow
        id="popular-title"
        title="Popular books"
        books={autoCollectionBooks("best-selling", all).slice(0, HOME.rowCount)}
        symbol={settings.currency_symbol}
        section={SECTIONS.myList}
        href="/collections/best-selling"
      />
    </>
  );
}
