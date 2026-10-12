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
        <Notice tone="error">{e instanceof Error ? e.message : "Analytics are unavailable."} Did you run supabase/schema.sql?</Notice>
      </>
    );
  }

  return (
    <>
      <AdminPageHead kicker={`Last ${days} days, real tracked numbers`} title="Dashboard" actions={<RangePicker value={days} basePath="/admin" />} />
      <AnalyticsBoard data={data} />

      <section className="mt-10" aria-labelledby="top-books">
        <div className="flex flex-wrap items-end justify-between gap-3 border-t-[3px] border-ink pt-3">
          <h2 id="top-books" className="text-title font-semibold">
            Top books
          </h2>
          <Link href={`/admin/searches?range=${days}`} className="link text-small">
            What people searched for
          </Link>
        </div>
        {top.length === 0 ? (
          <p className="mt-4 text-ink-2">No book activity in this period yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-small">
              <thead>
                <tr className="label border-b-2 border-ink text-ink-3">
                  <th className="py-2 font-medium">Book</th>
                  <th className="py-2 text-right font-medium">Views</th>
                  <th className="py-2 text-right font-medium">Previews</th>
                  <th className="py-2 text-right font-medium">WhatsApp</th>
                  <th className="py-2 text-right font-medium">Sales</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="font-mono tnum">
                {top.map((b) => (
                  <tr key={b.book_id} className="border-b border-paper-3">
                    <td className="py-2.5 pr-3 font-serif">
                      <Link href={`/admin/books/${b.book_id}/analytics?range=${days}`} className="font-semibold hover:underline">
                        {b.title}
                      </Link>
                      <span className="micro ml-2 text-ink-3">{b.book_code}</span>
                    </td>
                    <td className="py-2.5 text-right">{formatNumber(b.views)}</td>
                    <td className="py-2.5 text-right">{formatNumber(b.preview_opens)}</td>
                    <td className="py-2.5 text-right">{formatNumber(b.whatsapp_clicks)}</td>
                    <td className="py-2.5 text-right">{formatNumber(b.sales)}</td>
                    <td className="py-2.5 text-right">{formatPrice(b.revenue)}</td>
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
