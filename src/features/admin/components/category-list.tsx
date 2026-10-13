"use client";

import { mediaUrl } from "@/lib/media";
import { CategoryIcon } from "@/components/icons";
import type { CategoryRow } from "@/lib/supabase/database.types";
import { deleteCategory, reorderCategories } from "../actions/categories";
import { CategoryEditor } from "./category-editor";
import { DeleteButton } from "./delete-button";
import { OrderList } from "./order-list";

type Item = CategoryRow & { bookCount: number };

export function CategoryList({ categories }: { categories: Item[] }) {
  return (
    <OrderList
      items={categories}
      onSave={reorderCategories}
      empty={<p className="p-6 text-center text-base text-text-2">No categories yet.</p>}
      render={(c) => (
        <div className="flex items-center gap-3">
          <span className="relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-brand-soft text-brand">
            {c.image_path ? (
              // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
              <img src={mediaUrl(c.image_path)!} alt="" className="h-full w-full object-cover" />
            ) : (
              <CategoryIcon name={c.icon} size={18} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{c.name}</p>
            <p className="flex flex-wrap gap-x-2 text-sm text-text-3">
              <span>/category/{c.slug}</span>
              <span>{c.bookCount} books</span>
              {c.show_in_nav && <span className="badge badge-soft">Menu</span>}
              {c.show_on_home && <span className="badge badge-soft">Home</span>}
              {c.is_demo && <span className="badge badge-soft">Demo</span>}
            </p>
          </div>
          <CategoryEditor category={c} />
          <DeleteButton compact label={`“${c.name}”`} consequence="The category is removed from menus. Books keep their category text." action={deleteCategory.bind(null, c.id)} />
        </div>
      )}
    />
  );
}
