import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { adminListOffers } from "@/features/admin/queries";
import { deleteOffer } from "@/features/admin/actions/offers";
import { offerStatus } from "@/features/offers/schema";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { DeleteButton } from "@/features/admin/components/delete-button";
import { IconPlus } from "@/components/icons";

export const metadata = { title: "Offers" };

const STATUS_STYLE = { live: "badge-live", scheduled: "badge-offer", ended: "badge-draft", off: "badge-draft" } as const;

export default async function OffersAdminPage() {
  const offers = await adminListOffers();
  return (
    <>
      <AdminPageHead
        kicker={`${offers.filter((o) => offerStatus(o) === "live").length} live`}
        title="Offers"
        actions={
          <Link href="/admin/offers/new" className="btn btn-primary btn-sm">
            <IconPlus size={18} /> New offer
          </Link>
        }
      />
      {offers.length === 0 && <p className="text-ink-2">No offers yet.</p>}
      <ul className="border-t-[3px] border-ink">
        {offers.map((o) => {
          const st = offerStatus(o);
          const target = o.applies_to === "all" ? "every book" : o.applies_to === "books" ? `${o.bookIds.length} books` : `${o.collectionIds.length} collections`;
          return (
            <li key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-ink py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/offers/${o.id}`} className="font-semibold hover:underline">
                    {o.title}
                  </Link>
                  <span className={`badge ${STATUS_STYLE[st]}`}>{st}</span>
                  {o.is_demo && <span className="badge badge-demo">demo</span>}
                </div>
                <p className="micro mt-1 text-ink-3">
                  {o.discount_type === "percent" ? `${o.value}% off` : `${formatPrice(o.value)} off`} · {target} · {formatDate(o.start_at)}
                  {o.end_at ? ` to ${formatDate(o.end_at)}` : ", no end"}
                  {o.show_countdown ? " · countdown" : ""}
                </p>
              </div>
              <DeleteButton compact label={`“${o.title}”`} consequence="Prices go back to normal on the site within a few minutes." action={deleteOffer.bind(null, o.id)} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
