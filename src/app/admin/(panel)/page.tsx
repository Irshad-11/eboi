import Link from "next/link";
import { formatNumber, formatPrice } from "@/lib/format";
import { getAnalytics, getTopBooks, parseRange } from "@/features/analytics/queries";
import { AnalyticsBoard } from "@/features/analytics/components/analytics-board";
import { RangePicker } from "@/features/analytics/components/range-picker";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { Notice } from "@/features/admin/components/notice";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const days = parseRange((await searchParams).range);
  let data: Awaited<ReturnType<typeof getAnalytics>>;
  let top: Awaited<ReturnType<typeof getTopBooks>>;
  try {
    [data, top] = await Promise.all([getAnalytics(days), getTopBooks(days)]);
  } catch (e) {
    return (
      <>
        <AdminPageHead title="Dashboard" />
        <Notice tone="error">{e instanceof Error ? e.message : "Analytics are unavailable."} Did you run the SQL files in supabase/?</Notice>
      </>
    );
  }

  return (
    <>
      <AdminPageHead title="Dashboard" meta={`Last ${days} days`} actions={<RangePicker value={days} basePath="/admin" />} />
      <AnalyticsBoard data={data} />

      <section className="mt-4 rounded-lg border border-line bg-white" aria-labelledby="top-books">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 id="top-books" className="text-md font-semibold">
            Top books
          </h2>
          <Link href={`/admin/searches?range=${days}`} className="link text-sm">
            Search terms
          </Link>
        </div>
        {top.length === 0 ? (
          <p className="p-4 text-base text-text-2">No book activity in this period.</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-text-3">
                  <th className="px-4 py-2.5 font-medium">Book</th>
                  <th className="px-2 py-2.5 text-right font-medium">Views</th>
                  <th className="px-2 py-2.5 text-right font-medium">Previews</th>
                  <th className="px-2 py-2.5 text-right font-medium">WhatsApp</th>
                  <th className="px-2 py-2.5 text-right font-medium">Sales</th>
                  <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line tnum">
                {top.map((b) => (
                  <tr key={b.book_id} className="hover:bg-muted/60">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/books/${b.book_id}/analytics?range=${days}`} className="font-semibold hover:text-brand">
                        {b.title}
                      </Link>
                      <span className="ml-2 text-text-3">{b.book_code}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right">{formatNumber(b.views)}</td>
                    <td className="px-2 py-2.5 text-right">{formatNumber(b.preview_opens)}</td>
                    <td className="px-2 py-2.5 text-right">{formatNumber(b.whatsapp_clicks)}</td>
                    <td className="px-2 py-2.5 text-right">{formatNumber(b.sales)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{formatPrice(b.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
