import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { adminBookPicker, adminGetCollection } from "@/features/admin/queries";
import { deleteCollection } from "@/features/admin/actions/collections";
import { getSettings } from "@/features/settings/queries";
import { PreviewButton } from "@/features/admin/components/preview-panel";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { CollectionForm } from "@/features/admin/components/collection-form";
import { CollectionBooksEditor } from "@/features/admin/components/collection-books-editor";
import { DeleteButton } from "@/features/admin/components/delete-button";
import { IconExternal } from "@/components/icons";

export const metadata = { title: "Edit collection" };

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [found, books, settings] = await Promise.all([adminGetCollection(id), adminBookPicker(), getSettings()]);
  if (!found) notFound();
  const { collection, bookIds } = found;
  return (
    <>
      <AdminPageHead
        title={collection.name}
        back={{ href: "/admin/collections", label: "Collections" }}
        actions={
          <>
            <PreviewButton path={`/collections/${collection.slug}`} />
            <Link href={`/collections/${collection.slug}`} target="_blank" className="btn btn-secondary btn-sm">
              <IconExternal size={16} /> View
            </Link>
            <DeleteButton label={`“${collection.name}”`} consequence="Only the collection is removed. Its books stay in the shop." action={deleteCollection.bind(null, collection.id)} redirectTo="/admin/collections" />
          </>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <CollectionForm collection={collection} titleTemplate={settings.title_template} />
        <CollectionBooksEditor collectionId={collection.id} initial={bookIds} books={books} />
      </div>
    </>
  );
}
