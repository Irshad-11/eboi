"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MEDIA_FOLDERS } from "@/config/storage";
import { slugify } from "@/lib/slug";
import type { CollectionRow } from "@/lib/supabase/database.types";
import { saveCollection } from "../actions/collections";
import { AdminCard } from "./admin-page-head";
import { Field, Toggle } from "./field";
import { ImageUpload } from "./image-upload";
import { Notice } from "./notice";
import { RichTextEditor } from "./rich-text-editor";
import { SeoPanel, seoFromRow, seoToRow, type SeoValue } from "./seo-panel";

export function CollectionForm({ collection, titleTemplate }: { collection: CollectionRow | null; titleTemplate: string }) {
  const router = useRouter();
  const [id] = useState(() => collection?.id ?? crypto.randomUUID());
  const [name, setName] = useState(collection?.name ?? "");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [touched, setTouched] = useState(Boolean(collection));
  const [intro, setIntro] = useState(collection?.editorial_intro ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [image, setImage] = useState<string | null>(collection?.image_path ?? null);
  const [showHome, setShowHome] = useState(collection?.show_on_home ?? true);
  const [showNav, setShowNav] = useState(collection?.show_in_nav ?? false);
  const [seo, setSeo] = useState<SeoValue>(() => seoFromRow(collection));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveCollection(id, !collection, {
            name,
            slug,
            editorial_intro: intro,
            description,
            image_path: image,
            show_on_home: showHome,
            show_in_nav: showNav,
            mood: collection?.mood ?? "paper",
            sort_order: collection?.sort_order ?? 0,
            ...seoToRow(seo),
          });
          if (!res.ok) {
            setErrors(res.fieldErrors ?? {});
            setNotice({ tone: "error", text: res.error });
            return;
          }
          setErrors({});
          setNotice({ tone: "ok", text: res.message ?? "Saved." });
          if (!collection) router.replace(`/admin/collections/${id}`);
          else router.refresh();
        });
      }}
    >
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <AdminCard title="Collection">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="c-name" error={errors.name}>
            <input
              id="c-name"
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!touched) setSlug(slugify(e.target.value, ""));
              }}
            />
          </Field>
          <Field label="URL slug" htmlFor="c-slug" hint={`/collections/${slug || "…"}`} error={errors.slug}>
            <input
              id="c-slug"
              className="input"
              value={slug}
              onChange={(e) => {
                setTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
            />
          </Field>
          <Field label="Short intro" htmlFor="c-intro" hint="Shown under the title" error={errors.editorial_intro} className="sm:col-span-2">
            <textarea id="c-intro" rows={2} className="textarea min-h-16" value={intro} onChange={(e) => setIntro(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <p className="field-label">Description (shown below the books)</p>
            <RichTextEditor id="c-desc" value={description} onChange={setDescription} minHeight={8} />
          </div>
          <ImageUpload id="c-image" label="Tile image" hint="Used on collection tiles. Without one, covers are shown." folder={MEDIA_FOLDERS.collections} ownerId={id} value={image} onChange={setImage} aspect="4 / 3" />
          <div className="space-y-1">
            <Toggle id="c-home" label="Show on the home page" checked={showHome} onChange={setShowHome} />
            <Toggle id="c-nav" label="Show in the menu" checked={showNav} onChange={setShowNav} />
            {errors.image_path && <p className="field-error">{errors.image_path}</p>}
          </div>
        </div>
      </AdminCard>
      <AdminCard title="Search engines">
        <SeoPanel
          idPrefix="c-seo"
          value={seo}
          onChange={setSeo}
          autoTitle={`${name || "Collection"}: PDF books`}
          autoDescription={intro || "PDF books in this collection."}
          path={`/collections/${slug || "collection"}`}
          slug={slug}
          firstParagraph={intro}
          titleTemplate={titleTemplate}
          og={{ folder: MEDIA_FOLDERS.seo, ownerId: id }}
          errors={errors}
        />
      </AdminCard>
      <button className="btn btn-primary" data-loading={pending} disabled={pending}>
        {collection ? "Save collection" : "Create collection"}
      </button>
    </form>
  );
}
