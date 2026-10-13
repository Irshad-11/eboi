import { getSettings } from "@/features/settings/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { NavigationForm } from "@/features/admin/components/navigation-form";

export const metadata = { title: "Menus and footer" };

export default async function NavigationPage() {
  const s = await getSettings();
  return (
    <>
      <AdminPageHead title="Menus and footer" meta="Categories and collections set to “Show in the menu” appear in the menu bar automatically." />
      <NavigationForm header={s.header_links} footer={s.footer_columns} social={s.social_links} />
    </>
  );
}
