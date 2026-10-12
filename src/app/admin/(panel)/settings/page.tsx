import { getAdminSettings } from "@/features/admin/settings-query";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { SettingsForm } from "@/features/admin/components/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getAdminSettings();
  return (
    <>
      <AdminPageHead kicker="Shop-wide" title="Settings" />
      <SettingsForm settings={settings} />
    </>
  );
}
