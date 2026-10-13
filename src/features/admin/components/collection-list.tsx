"use client";

import Link from "next/link";
import type { CollectionRow } from "@/lib/supabase/database.types";
import { IconEdit } from "@/components/icons";
import { deleteCollection, reorderCollections } from "../actions/collections";
import { DeleteButton } from "./delete-button";
import { OrderList } from "./order-list";

export function CollectionList({ collections }: { collections: (CollectionRow & { bookCount: number })[] }) {
  return (
    <OrderList
      items={collections}
      onSave={reorderCollections}
      empty={
        <div className="p-6 text-center">
          <Link href="/admin/collections/new" className="btn btn-primary">
            Add collection
          </Link>
        </div>
      }
      render={(c) => (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Link href={`/admin/collections/${c.id}`} className="truncate text-base font-semibold hover:text-brand">
              {c.name}
            </Link>
            <p className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-text-3">
              <span>/collections/{c.slug}</span>
              <span>{c.bookCount} books</span>
              {c.show_on_home && <span className="badge badge-soft">Home</span>}
              {c.show_in_nav && <span className="badge badge-soft">Menu</span>}
              {c.is_demo && <span className="badge badge-soft">Demo</span>}
            </p>
          </div>
          <Link href={`/admin/collections/${c.id}`} className="btn btn-ghost btn-icon btn-sm" aria-label={`Edit ${c.name}`} title="Edit">
            <IconEdit size={16} />
          </Link>
          <DeleteButton compact label={`“${c.name}”`} consequence="Only the collection is removed. Its books stay in the shop." action={deleteCollection.bind(null, c.id)} />
        </div>
      )}
    />
  );
}
