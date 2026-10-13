import Link from "next/link";
import { adminListCollections } from "@/features/admin/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { CollectionList } from "@/features/admin/components/collection-list";
import { IconPlus } from "@/components/icons";

export const metadata = { title: "Collections" };

export default async function CollectionsAdminPage() {
  const collections = await adminListCollections();
  return (
    <>
      <AdminPageHead
        title="Collections"
        meta="Best selling, New arrivals and Most viewed are automatic. Order here sets the order on the home page."
        actions={
          <Link href="/admin/collections/new" className="btn btn-primary">
            <IconPlus size={18} /> Add collection
          </Link>
        }
      />
      <div className="rounded-lg border border-line bg-white">
        <CollectionList collections={collections} />
      </div>
    </>
  );
}
