import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { adminListOffers } from "@/features/admin/queries";
import { deleteOffer } from "@/features/admin/actions/offers";
import { offerStatus } from "@/features/offers/schema";
import { PreviewButton } from "@/features/admin/components/preview-panel";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { DeleteButton } from "@/features/admin/components/delete-button";
import { IconEdit, IconPlus } from "@/components/icons";

export const metadata = { title: "Offers" };

const STATUS = {
  live: { label: "Live", cls: "badge-ok" },
  scheduled: { label: "Scheduled", cls: "badge-warn" },
  ended: { label: "Ended", cls: "badge-soft" },
  off: { label: "Off", cls: "badge-soft" },
} as const;

export default async function OffersAdminPage() {
  const offers = await adminListOffers();
  return (
    <>
      <AdminPageHead
        title="Offers"
        meta={`${offers.filter((o) => offerStatus(o) === "live").length} live`}
        actions={
          <>
            <PreviewButton path="/shop?deals=1" />
            <Link href="/admin/offers/new" className="btn btn-primary">
              <IconPlus size={18} /> Add offer
            </Link>
          </>
        }
      />
      <div className="rounded-lg border border-line bg-white">
        {offers.length === 0 ? (
          <div className="p-6 text-center">
            <Link href="/admin/offers/new" className="btn btn-primary">
              Add offer
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {offers.map((o) => {
              const st = STATUS[offerStatus(o)];
              const target = o.applies_to === "all" ? "Every book" : o.applies_to === "books" ? `${o.bookIds.length} books` : `${o.collectionIds.length} collections`;
              return (
                <li key={o.id} className="flex items-center gap-3 px-3 py-3 md:px-4">
                  <span className="badge badge-sale shrink-0">{o.discount_type === "percent" ? `${Number(o.value)}% off` : `${formatPrice(Number(o.value))} off`}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/offers/${o.id}`} className="text-base font-semibold hover:text-brand">
                      {o.title}
                    </Link>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-3">
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      <span>{target}</span>
                      <span>
                        {formatDate(o.start_at)}
                        {o.end_at ? ` – ${formatDate(o.end_at)}` : ""}
                      </span>
                      {o.is_demo && <span className="badge badge-soft">Demo</span>}
                    </p>
                  </div>
                  <Link href={`/admin/offers/${o.id}`} className="btn btn-ghost btn-icon btn-sm" aria-label={`Edit ${o.title}`} title="Edit">
                    <IconEdit size={16} />
                  </Link>
                  <DeleteButton compact label={`“${o.title}”`} consequence="Prices go back to normal on the site within a few minutes." action={deleteOffer.bind(null, o.id)} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
