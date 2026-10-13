import { getSettings } from "@/features/settings/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { PagesForm } from "@/features/admin/components/pages-form";

export const metadata = { title: "Pages" };

export default async function PagesAdminPage() {
  const s = await getSettings();
  return (
    <>
      <AdminPageHead title="Pages" />
      <PagesForm about={s.about_content} terms={s.terms_content} howToOrder={s.how_to_order_content} faq={s.faq_items} />
    </>
  );
}
