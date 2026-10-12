import Link from "next/link";
import { formatDate, formatMonth, formatNumber, formatPrice } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";
import { withPricing } from "@/features/offers/queries";
import { deleteSale } from "@/features/admin/actions/sales";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { SaleForm } from "@/features/admin/components/sale-form";
import { DeleteButton } from "@/features/admin/components/delete-button";
import { StatTile } from "@/features/analytics/components/stat-tile";

export const metadata = { title: "Sales log" };

export default async function SalesPage() {
  const supabase = await createSessionClient();
  const [{ data: sales }, { data: months }, { data: books }] = await Promise.all([
    supabase.from("sales_log").select("*").order("sold_at", { ascending: false }).limit(100),
    supabase.from("sales_by_month").select("*").order("month", { ascending: false }).limit(12),
    supabase.from("books").select("id, title, book_code, price, old_price, offer_id").order("title"),
  ]);
  // Prefill uses the price a buyer would see today, offers included.
  const priced = await withPricing(books ?? []);
  const all = months ?? [];
  const thisMonth = all[0];
  const total = all.reduce((s, m) => ({ sales: s.sales + Number(m.sales), revenue: s.revenue + Number(m.revenue) }), { sales: 0, revenue: 0 });

  return (
    <>
      <AdminPageHead kicker="Every sale you close on WhatsApp" title="Sales log" />
      <SaleForm books={priced.map((b) => ({ id: b.id, title: b.title, book_code: b.book_code, finalPrice: b.pricing.final }))} />

      <div className="mt-10 grid gap-px border-2 border-ink bg-ink sm:grid-cols-3">
        <StatTile label={thisMonth ? formatMonth(thisMonth.month) : "This month"} value={formatPrice(Number(thisMonth?.revenue ?? 0))} sub={`${formatNumber(Number(thisMonth?.sales ?? 0))} sales`} />
        <StatTile label="Last 12 months" value={formatPrice(total.revenue)} sub={`${formatNumber(total.sales)} sales`} />
        <StatTile label="Average sale" value={formatPrice(total.sales ? Math.round(total.revenue / total.sales) : 0)} sub="Over 12 months" />
      </div>

      <section className="mt-12" aria-labelledby="recent-sales">
        <h2 id="recent-sales" className="border-t-[3px] border-ink pt-3 text-title font-semibold">
          Recent sales
        </h2>
        {!sales?.length ? (
          <p className="mt-4 text-ink-2">No sales logged yet.</p>
        ) : (
          <ul className="mt-2">
            {sales.map((s) => (
              <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-ink py-2.5">
                <div className="min-w-0">
                  {s.book_id ? (
                    <Link href={`/admin/books/${s.book_id}`} className="line-clamp-1 font-semibold hover:underline">
                      {s.book_title_snapshot}
                    </Link>
                  ) : (
                    <span className="line-clamp-1 font-semibold">{s.book_title_snapshot} <span className="micro text-ink-3">(deleted)</span></span>
                  )}
                  <p className="micro text-ink-3">
                    {s.book_code_snapshot} · {formatDate(s.sold_at)}
                    {s.note ? ` · ${s.note}` : ""}
                    {s.is_demo ? " · demo" : ""}
                  </p>
                </div>
                <span className="price">{formatPrice(Number(s.price_snapshot))}</span>
                <DeleteButton compact label="this sale" consequence="The entry is removed and the book's total sold goes down by one." action={deleteSale.bind(null, s.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
