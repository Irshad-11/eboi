"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MEDIA_FOLDERS } from "@/config/storage";
import { slugify } from "@/lib/slug";
import { CATEGORY_ICONS, CategoryIcon, IconEdit, IconPlus } from "@/components/icons";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { CategoryRow } from "@/lib/supabase/database.types";
import { saveCategory, type CategoryInput } from "../actions/categories";
import { Field, Toggle } from "./field";
import { ImageUpload } from "./image-upload";
import { Notice } from "./notice";

type Props = { category: CategoryRow | null };

/** Add/edit a category in a dialog. */
export function CategoryEditor({ category }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(category?.id ?? "");
  const blank = (): CategoryInput => ({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    icon: category?.icon ?? "book",
    image_path: category?.image_path ?? null,
    sort_order: category?.sort_order ?? 0,
    show_in_nav: category?.show_in_nav ?? true,
    show_on_home: category?.show_on_home ?? true,
  });
  const [v, setV] = useState<CategoryInput>(blank);
  const [touched, setTouched] = useState(Boolean(category));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof CategoryInput>(k: K, val: CategoryInput[K]) => setV((p) => ({ ...p, [k]: val }));

  const openDialog = () => {
    if (!category) setId(crypto.randomUUID());
    setV(blank());
    setErrors({});
    setError(null);
    setOpen(true);
  };

  return (
    <>
      {category ? (
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={openDialog} aria-label={`Edit ${category.name}`} title="Edit">
          <IconEdit size={16} />
        </button>
      ) : (
        <button type="button" className="btn btn-primary" onClick={openDialog}>
          <IconPlus size={18} /> Add category
        </button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={category ? "Edit category" : "Add category"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await saveCategory(id, !category, v);
                  if (!res.ok) {
                    setErrors(res.fieldErrors ?? {});
                    setError(res.error);
                    return;
                  }
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <Notice tone="error">{error}</Notice>}
          <Field label="Name" htmlFor="cat-name" error={errors.name}>
            <input
              id="cat-name"
              className="input"
              value={v.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!touched) set("slug", slugify(e.target.value, ""));
              }}
            />
          </Field>
          <Field label="URL slug" htmlFor="cat-slug" hint={`/category/${v.slug || "…"}`} error={errors.slug}>
            <input
              id="cat-slug"
              className="input"
              value={v.slug}
              onChange={(e) => {
                setTouched(true);
                set("slug", e.target.value.toLowerCase());
              }}
            />
          </Field>
          <fieldset>
            <legend className="field-label">Icon</legend>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(CATEGORY_ICONS).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => set("icon", name)}
                  aria-pressed={v.icon === name}
                  aria-label={name}
                  title={name}
                  className={cn("inline-flex size-10 items-center justify-center rounded-md border", v.icon === name ? "border-brand bg-brand-soft text-brand" : "border-line text-text-2 hover:border-line-2")}
                >
                  <CategoryIcon name={name} size={20} />
                </button>
              ))}
            </div>
          </fieldset>
          {id && (
            <ImageUpload
              id="cat-image"
              label="Image (optional, replaces the icon)"
              folder={MEDIA_FOLDERS.categories}
              ownerId={id}
              value={v.image_path ?? null}
              onChange={(p) => set("image_path", p)}
              aspect="1 / 1"
            />
          )}
          {errors.image_path && <p className="field-error">{errors.image_path}</p>}
          <Toggle id="cat-nav" label="Show in the menu" checked={Boolean(v.show_in_nav)} onChange={(c) => set("show_in_nav", c)} />
          <Toggle id="cat-home" label="Show on the home page" checked={Boolean(v.show_on_home)} onChange={(c) => set("show_on_home", c)} />
        </div>
      </Dialog>
    </>
  );
}
