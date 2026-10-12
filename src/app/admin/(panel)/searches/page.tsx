import Link from "next/link";
import { formatDate, formatNumber } from "@/lib/format";
import { getSearchTerms, parseRange } from "@/features/analytics/queries";
import { RangePicker } from "@/features/analytics/components/range-picker";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";

export const metadata = { title: "Search terms" };

/** What readers typed. Zero-result searches are a shopping list of books to add. */
export default async function SearchesPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const days = parseRange((await searchParams).range);
  const terms = await getSearchTerms(days);
  const zero = terms.filter((t) => t.last_result_count === 0);

  return (
    <>
      <AdminPageHead kicker={`Last ${days} days`} title="Search terms" actions={<RangePicker value={days} basePath="/admin/searches" />} />
      <div className="grid gap-10 lg:grid-cols-12">
        <section className="lg:col-span-5" aria-labelledby="zero-title">
          <h2 id="zero-title" className="border-t-[3px] border-ink pt-3 text-title font-semibold">
            Found nothing ({zero.length})
          </h2>
          <p className="mt-1 text-small text-ink-3">People wanted these and left empty-handed. Books to add, or tags to add.</p>
          <ul className="mt-4">
            {zero.map((t) => (
              <li key={t.term} className="flex items-baseline justify-between gap-3 border-b border-ink py-2">
                <span className="font-semibold">{t.term}</span>
                <span className="micro text-ink-3">{formatNumber(t.searches)}×</span>
              </li>
            ))}
            {zero.length === 0 && <li className="text-small text-ink-3">Nothing yet.</li>}
          </ul>
        </section>
        <section className="lg:col-span-7" aria-labelledby="all-title">
          <h2 id="all-title" className="border-t-[3px] border-ink pt-3 text-title font-semibold">
            All searches
          </h2>
          <table className="mt-3 w-full text-left text-small">
            <thead>
              <tr className="label border-b-2 border-ink text-ink-3">
                <th className="py-2 font-medium">Term</th>
                <th className="py-2 text-right font-medium">Times</th>
                <th className="py-2 text-right font-medium">Results now</th>
                <th className="hidden py-2 text-right font-medium sm:table-cell">Last</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((t) => (
                <tr key={t.term} className="border-b border-paper-3">
                  <td className="py-2">
                    <Link href={`/shop?q=${encodeURIComponent(t.term)}`} target="_blank" className="hover:underline">
                      {t.term}
                    </Link>
                  </td>
                  <td className="py-2 text-right font-mono">{formatNumber(t.searches)}</td>
                  <td className={`py-2 text-right font-mono ${t.last_result_count === 0 ? "text-rust" : ""}`}>{t.last_result_count ?? "?"}</td>
                  <td className="hidden py-2 text-right font-mono text-ink-3 sm:table-cell">{formatDate(t.last_searched_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {terms.length === 0 && <p className="mt-4 text-small text-ink-3">No searches in this period.</p>}
        </section>
      </div>
    </>
  );
}
