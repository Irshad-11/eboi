import { getAdminSettings } from "@/features/admin/settings-query";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { PagesForm } from "@/features/admin/components/pages-form";

export const metadata = { title: "Pages" };

export default async function PagesAdminPage() {
  const s = await getAdminSettings();
  return (
    <>
      <AdminPageHead kicker="About, How to buy, FAQ, Terms" title="Pages" />
      <PagesForm about={s.about_content} terms={s.terms_content} faq={s.faq_items} steps={s.how_to_buy_steps} />
    </>
  );
}
