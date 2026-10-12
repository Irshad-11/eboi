import { notFound } from "next/navigation";
import { z } from "zod";
import { adminBookPicker, adminFormOptions, adminListOffers } from "@/features/admin/queries";
import { deleteOffer } from "@/features/admin/actions/offers";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { OfferForm } from "@/features/admin/components/offer-form";
import { DeleteButton } from "@/features/admin/components/delete-button";

export const metadata = { title: "Edit offer" };

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [offers, books, opts] = await Promise.all([adminListOffers(), adminBookPicker(), adminFormOptions()]);
  const offer = offers.find((o) => o.id === id);
  if (!offer) notFound();
  return (
    <>
      <AdminPageHead
        kicker="Offer"
        title={offer.title}
        actions={<DeleteButton label={`“${offer.title}”`} consequence="Prices go back to normal on the site within a few minutes." action={deleteOffer.bind(null, offer.id)} redirectTo="/admin/offers" />}
      />
      <OfferForm offer={offer} books={books} collections={opts.collections} />
    </>
  );
}
