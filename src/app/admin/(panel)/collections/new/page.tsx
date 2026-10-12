import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { CollectionForm } from "@/features/admin/components/collection-form";

export const metadata = { title: "New collection" };

export default function NewCollectionPage() {
  return (
    <>
      <AdminPageHead kicker="Collections" title="New collection" />
      <CollectionForm collection={null} />
    </>
  );
}
