import Link from "next/link";
import { formatDate, formatMonth, formatNumber, formatPrice } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";
import { withPricing } from "@/features/offers/queries";
import { deleteSale } from "@/features/admin/actions/sales";
import { AdminCard, AdminPageHead } from "@/features/admin/components/admin-page-head";
import { SaleForm } from "@/features/admin/components/sale-form";
import { DeleteButton } from "@/features/admin/components/delete-button";
import { StatTile } from "@/features/analytics/components/stat-tile";

export const metadata = { title: "Sales log" };

export default async function SalesPage() {
  const supabase = await createSessionClient();
  const [{ data: sales }, { data: months }, { data: books }] = await Promise.all([
    supabase.from("sales_log").select("*").order("sold_at", { ascending: false }).limit(100),
    supabase.from("sales_by_month").select("*").order("month", { ascending: false }).limit(12),
    supabase.from("books").select("id, title, book_code, price, old_price, offer_id, is_free, free_until").order("title"),
  ]);
  // Prefill uses the price a buyer would see today, offers included.
  const priced = await withPricing(books ?? []);
  const all = months ?? [];
  const thisMonth = all[0];
  const total = all.reduce((s, m) => ({ sales: s.sales + Number(m.sales), revenue: s.revenue + Number(m.revenue) }), { sales: 0, revenue: 0 });

  return (
    <>
      <AdminPageHead title="Sales log" meta="Log every order you close on WhatsApp" />
      <AdminCard title="Log a sale">
        <SaleForm books={priced.map((b) => ({ id: b.id, title: b.title, book_code: b.book_code, finalPrice: b.pricing.final }))} />
      </AdminCard>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatTile label={thisMonth ? formatMonth(thisMonth.month) : "This month"} value={formatPrice(Number(thisMonth?.revenue ?? 0))} sub={`${formatNumber(Number(thisMonth?.sales ?? 0))} sales`} />
        <StatTile label="Last 12 months" value={formatPrice(total.revenue)} sub={`${formatNumber(total.sales)} sales`} />
        <StatTile label="Average sale" value={formatPrice(total.sales ? Math.round(total.revenue / total.sales) : 0)} sub="Over 12 months" />
      </div>

      <AdminCard title="Recent sales" className="mt-4">
        {!sales?.length ? (
          <p className="text-base text-text-2">No sales logged yet.</p>
        ) : (
          <ul className="-my-2 divide-y divide-line">
            {sales.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  {s.book_id ? (
                    <Link href={`/admin/books/${s.book_id}`} className="line-clamp-1 text-base font-semibold hover:text-brand">
                      {s.book_title_snapshot}
                    </Link>
                  ) : (
                    <span className="line-clamp-1 text-base font-semibold">
                      {s.book_title_snapshot} <span className="font-normal text-text-3">(deleted)</span>
                    </span>
                  )}
                  <p className="text-sm text-text-3">
                    {s.book_code_snapshot} · {formatDate(s.sold_at)}
                    {s.note ? ` · ${s.note}` : ""}
                    {s.is_demo ? " · demo" : ""}
                  </p>
                </div>
                <span className="text-base font-semibold tnum">{formatPrice(Number(s.price_snapshot))}</span>
                <DeleteButton compact label="this sale" consequence="The entry is removed and the book's total sold goes down by one." action={deleteSale.bind(null, s.id)} />
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
