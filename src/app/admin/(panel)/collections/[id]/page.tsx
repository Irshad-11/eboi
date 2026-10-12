import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { adminBookPicker, adminGetCollection } from "@/features/admin/queries";
import { deleteCollection } from "@/features/admin/actions/collections";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { CollectionForm } from "@/features/admin/components/collection-form";
import { CollectionBooksEditor } from "@/features/admin/components/collection-books-editor";
import { DeleteButton } from "@/features/admin/components/delete-button";

export const metadata = { title: "Edit collection" };

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [found, books] = await Promise.all([adminGetCollection(id), adminBookPicker()]);
  if (!found) notFound();
  const { collection, bookIds } = found;
  return (
    <>
      <AdminPageHead
        kicker="Collection"
        title={collection.name}
        actions={
          <>
            <Link href={`/collections/${collection.slug}`} target="_blank" className="btn btn-outline btn-sm">
              View
            </Link>
            <DeleteButton label={`“${collection.name}”`} consequence="Only the collection is removed. Its books stay in the shop." action={deleteCollection.bind(null, collection.id)} redirectTo="/admin/collections" />
          </>
        }
      />
      <div className="space-y-14">
        <CollectionForm collection={collection} />
        <CollectionBooksEditor collectionId={collection.id} initial={bookIds} books={books} />
      </div>
    </>
  );
}
