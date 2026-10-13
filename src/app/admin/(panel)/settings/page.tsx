import { getSettings } from "@/features/settings/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { SettingsForm } from "@/features/admin/components/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <AdminPageHead title="Settings" />
      <SettingsForm settings={settings} />
    </>
  );
}
