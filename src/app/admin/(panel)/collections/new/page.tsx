import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { CollectionForm } from "@/features/admin/components/collection-form";
import { getSettings } from "@/features/settings/queries";

export const metadata = { title: "Add collection" };

export default async function NewCollectionPage() {
  const s = await getSettings();
  return (
    <>
      <AdminPageHead title="Add collection" back={{ href: "/admin/collections", label: "Collections" }} />
      <CollectionForm collection={null} titleTemplate={s.title_template} />
    </>
  );
}
