import { getSettings } from "@/features/settings/queries";
import { PreviewButton } from "@/features/admin/components/preview-panel";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { HomeLayoutForm } from "@/features/admin/components/home-layout-form";

export const metadata = { title: "Home layout" };

export default async function HomeLayoutPage() {
  const s = await getSettings();
  return (
    <>
      <AdminPageHead title="Home layout" meta="Turn sections on or off and set their order." actions={<PreviewButton path="/" />} />
      <HomeLayoutForm sections={s.home_sections} />
    </>
  );
}
