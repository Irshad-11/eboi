import type { Metadata } from "next";
import { getPublishedBooks, toLite } from "@/features/books/queries";
import { PageHeader } from "@/components/page-header";
import { ListWithSend, MyListView } from "@/features/my-list/my-list-view";
import { ContinueBrowsing } from "@/features/my-list/continue-browsing";

export const metadata: Metadata = {
  title: "My List",
  description: "Your shortlist of eBoi PDFs. Send them all in one WhatsApp message.",
  alternates: { canonical: "/my-list" },
  // Personal, per-browser content: nothing for search engines here.
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

  // A list link sent in a WhatsApp message (?books=EB-0001,EB-0004) shows
  // exactly those books, so the shop owner sees what the buyer saw.
  if (codes.length) {
    const all = await getPublishedBooks();
    const byCode = new Map(all.map((b) => [b.book_code, b]));
    const shared = codes.flatMap((c) => {
      const b = byCode.get(c);
      return b ? [toLite(b)] : [];
    });
    return (
      <>
        <PageHeader kicker="Shared list" title="A list of books" path="/my-list" crumb="My List" lead="Someone shared these PDFs with you. Prices shown are today's." />
        <section className="container-x pb-20">
          {shared.length ? <ListWithSend books={shared} /> : <p className="text-lead text-ink-2">These books are no longer available.</p>}
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="My List" title="Your shortlist" path="/my-list" crumb="My List" lead="Kept in this browser. Send them all in one message when you are ready." />
      <section className="container-x pb-12">
        <MyListView />
      </section>
      <ContinueBrowsing />
    </>
  );
}
