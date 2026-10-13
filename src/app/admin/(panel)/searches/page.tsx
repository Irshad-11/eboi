import Link from "next/link";
import { formatDate, formatNumber } from "@/lib/format";
import { getSearchTerms, parseRange } from "@/features/analytics/queries";
import { RangePicker } from "@/features/analytics/components/range-picker";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { AdminCard } from "@/features/admin/components/admin-page-head";

export const metadata = { title: "Search terms" };

/** What visitors typed. Searches that found nothing first: books or tags to add. */
export default async function SearchesPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const days = parseRange((await searchParams).range);
  const terms = await getSearchTerms(days);
  const zero = terms.filter((t) => t.last_result_count === 0);

  return (
    <>
      <AdminPageHead title="Search terms" meta={`Last ${days} days`} actions={<RangePicker value={days} basePath="/admin/searches" />} />
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <AdminCard title={`Found nothing (${zero.length})`}>
          {zero.length ? (
            <ul className="divide-y divide-line">
              {zero.map((t) => (
                <li key={t.term} className="flex items-baseline justify-between gap-3 py-2 text-base">
                  <span className="font-semibold">{t.term}</span>
                  <span className="text-sm text-text-3">{formatNumber(t.searches)}×</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-3">None.</p>
          )}
        </AdminCard>
        <AdminCard title="All searches">
          {terms.length ? (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-text-3">
                    <th className="py-2 font-medium">Term</th>
                    <th className="py-2 text-right font-medium">Times</th>
                    <th className="py-2 text-right font-medium">Results now</th>
                    <th className="hidden py-2 text-right font-medium sm:table-cell">Last</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {terms.map((t) => (
                    <tr key={t.term}>
                      <td className="py-2">
                        <Link href={`/shop?q=${encodeURIComponent(t.term)}`} target="_blank" className="hover:text-brand">
                          {t.term}
                        </Link>
                      </td>
                      <td className="py-2 text-right tnum">{formatNumber(t.searches)}</td>
                      <td className={`py-2 text-right tnum ${t.last_result_count === 0 ? "text-sale" : ""}`}>{t.last_result_count ?? "–"}</td>
                      <td className="hidden py-2 text-right text-text-3 sm:table-cell">{formatDate(t.last_searched_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-3">No searches in this period.</p>
          )}
        </AdminCard>
      </div>
    </>
  );
}
