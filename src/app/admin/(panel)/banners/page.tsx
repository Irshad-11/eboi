import { adminListBanners } from "@/features/admin/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { BannerEditor } from "@/features/admin/components/banner-editor";
import { BannerList } from "@/features/admin/components/banner-list";

export const metadata = { title: "Banners" };

export default async function BannersPage() {
  const banners = await adminListBanners();
  return (
    <>
      <AdminPageHead title="Banners" meta="Slides in the home page carousel, in this order." actions={<BannerEditor banner={null} />} />
      <div className="rounded-lg border border-line bg-white">
        <BannerList banners={banners} />
      </div>
    </>
  );
}
