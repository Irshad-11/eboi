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
        title={book.title}
        back={{ href: `/admin/books/${id}`, label: "Edit book" }}
        meta={`${book.book_code} · last ${days} days`}
        actions={
          <>
            <RangePicker value={days} basePath={`/admin/books/${id}/analytics`} />
            <Link href={`/admin/books/${id}`} className="btn btn-secondary btn-sm">
              Edit book
            </Link>
          </>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-muted p-4">
          <p className="text-sm font-semibold text-text-2">Shown on the site</p>
          <p className="mt-1 text-sm tnum">
            {formatNumber(book.views)} views · {formatNumber(book.total_sells)} sold · {Number(book.rating).toFixed(1)} rating ({formatNumber(book.rating_count)})
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-semibold text-text-2">Tracked in this period</p>
          <p className="mt-1 text-sm tnum">
            {formatNumber(data.current.book_views)} views · {formatNumber(data.current.sales)} sold · {formatNumber(data.current.visitors)} visitors
          </p>
        </div>
      </div>
      <AnalyticsBoard data={data} perBook />
    </>
  );
}
