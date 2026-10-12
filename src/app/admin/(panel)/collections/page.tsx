import Link from "next/link";
import { adminListCollections } from "@/features/admin/queries";
import { deleteCollection } from "@/features/admin/actions/collections";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { DeleteButton } from "@/features/admin/components/delete-button";
import { IconPlus } from "@/components/icons";
import { AUTO_COLLECTIONS } from "@/config/site";

export const metadata = { title: "Collections" };

export default async function CollectionsAdminPage() {
  const collections = await adminListCollections();
  return (
    <>
      <AdminPageHead
        kicker={`${collections.length} custom · 3 automatic`}
        title="Collections"
        actions={
          <Link href="/admin/collections/new" className="btn btn-primary btn-sm">
            <IconPlus size={18} /> New collection
          </Link>
        }
      />
      <ul className="border-t-[3px] border-ink">
        {collections.map((c) => (
          <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-ink py-3">
            <div className="min-w-0">
              <Link href={`/admin/collections/${c.id}`} className="font-semibold hover:underline">
                {c.name}
              </Link>
              <p className="micro mt-1 flex flex-wrap gap-x-3 text-ink-3">
                <span>/{c.slug}</span>
                <span>{c.bookCount} books</span>
                <span>mood: {c.mood}</span>
                <span>order {c.sort_order}</span>
                <span>{c.show_on_home ? "on home" : "not on home"}</span>
                {c.is_demo && <span>demo</span>}
              </p>
            </div>
            <DeleteButton compact label={`“${c.name}”`} consequence="Only the collection is removed. Its books stay in the shop." action={deleteCollection.bind(null, c.id)} />
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <p className="label text-ink-3">Automatic (not editable)</p>
        <ul className="mt-3 space-y-1">
          {Object.entries(AUTO_COLLECTIONS).map(([slug, a]) => (
            <li key={slug} className="text-small">
              <Link href={`/collections/${slug}`} target="_blank" className="link font-semibold">
                {a.name}
              </Link>{" "}
              <span className="text-ink-3">· {a.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
