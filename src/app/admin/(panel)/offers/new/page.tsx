import { adminBookPicker, adminFormOptions } from "@/features/admin/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { OfferForm } from "@/features/admin/components/offer-form";

export const metadata = { title: "New offer" };

export default async function NewOfferPage() {
  const [books, opts] = await Promise.all([adminBookPicker(), adminFormOptions()]);
  return (
    <>
      <AdminPageHead kicker="Offers" title="New offer" />
      <OfferForm offer={null} books={books} collections={opts.collections} />
    </>
  );
}
