import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { formatNumber } from "@/lib/format";
import { adminGetBook } from "@/features/admin/queries";
import { getAnalytics, parseRange } from "@/features/analytics/queries";
import { AnalyticsBoard } from "@/features/analytics/components/analytics-board";
import { RangePicker } from "@/features/analytics/components/range-picker";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";

export const metadata = { title: "Book analytics" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ range?: string }> };

export default async function BookAnalyticsPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const days = parseRange((await searchParams).range);
  const [found, data] = await Promise.all([adminGetBook(id), getAnalytics(days, id)]);
  if (!found) notFound();
  const { book } = found;

  return (
    <>
      <AdminPageHead
        kicker={`${book.book_code} · last ${days} days`}
        title={book.title}
        actions={
          <>
            <RangePicker value={days} basePath={`/admin/books/${id}/analytics`} />
            <Link href={`/admin/books/${id}`} className="btn btn-outline btn-sm">
              Edit book
            </Link>
          </>
        }
      />
      {/* Public display numbers are editable; real tracked numbers are never mixed in. */}
      <div className="mb-8 grid gap-px border-2 border-ink bg-ink sm:grid-cols-2">
        <div className="bg-paper-2 p-4">
          <p className="label text-ink-3">Shown on the site (display values)</p>
          <p className="mt-2 font-mono text-small">
            {formatNumber(book.views)} views · {formatNumber(book.total_sells)} sold · {Number(book.rating).toFixed(1)} rating ({formatNumber(book.rating_count)})
          </p>
        </div>
        <div className="bg-paper p-4">
          <p className="label text-ink-3">Real, tracked in this period</p>
          <p className="mt-2 font-mono text-small">
            {formatNumber(data.current.book_views)} views · {formatNumber(data.current.sales)} sold · {formatNumber(data.current.visitors)} unique visitors
          </p>
        </div>
      </div>
      <AnalyticsBoard data={data} perBook />
    </>
  );
}
