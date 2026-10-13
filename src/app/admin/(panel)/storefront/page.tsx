import { getSettings } from "@/features/settings/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { StorefrontForm } from "@/features/admin/components/storefront-form";
import { PreviewButton } from "@/features/admin/components/preview-panel";

export const metadata = { title: "Notices and features" };

export default async function StorefrontPage() {
  const settings = await getSettings();
  return (
    <>
      <AdminPageHead title="Notices and features" meta="Announcement bar, pop-up, slider speed and optional store features" actions={<PreviewButton path="/" />} />
      <StorefrontForm settings={settings} />
    </>
  );
}
