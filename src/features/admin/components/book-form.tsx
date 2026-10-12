"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COVER, PREVIEW } from "@/config/limits";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/cn";
import type { BookRow } from "@/lib/supabase/database.types";
import { coverUrl } from "@/features/books/cover";
import { bookInputSchema, type BookFormValues } from "@/features/books/schema";
import { IconExternal } from "@/components/icons";
import { discardUploads, saveBook, type SaveBookInput } from "../actions/books";
import { checkCover, checkPreview, uploadCover, uploadPreview } from "../uploads";
import { Field, FieldGroup } from "./field";
import { Notice } from "./notice";

type Props = {
  book: BookRow | null;
  collections: { id: string; name: string }[];
  memberOf: string[];
  offers: { id: string; title: string; is_active: boolean }[];
  categories: string[];
  languages: string[];
};

type FileState<C> = { file: File; check: C } | null;

/**
 * Create/edit form for every book field. Flow on save:
 *   1. validate in the browser (same zod schema as the server)
 *   2. upload new cover/preview straight to private storage
 *   3. call saveBook(), which re-checks everything and cleans up on failure
 */
export function BookForm({ book, collections, memberOf, offers, categories, languages }: Props) {
  const router = useRouter();
  // New books get their id up front so uploads land in the right folder.
  const [id] = useState(() => book?.id ?? crypto.randomUUID());
  const [title, setTitle] = useState(book?.title ?? "");
  const [slug, setSlug] = useState(book?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(book));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [cover, setCover] = useState<FileState<Awaited<ReturnType<typeof checkCover>>>>(null);
  const [preview, setPreview] = useState<FileState<Awaited<ReturnType<typeof checkPreview>>>>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [removePreview, setRemovePreview] = useState(false);

  const coverSrc = useMemo(() => {
    if (cover?.file) return URL.createObjectURL(cover.file);
    return book && !removeCover ? coverUrl(book) : null;
  }, [cover, book, removeCover]);

  function readValues(fd: FormData): BookFormValues {
    const s = (k: string) => String(fd.get(k) ?? "").trim();
    const opt = (k: string) => s(k) || null;
    return {
      title,
      slug: slug || slugify(title),
      subtitle: opt("subtitle"),
      author: s("author"),
      category: s("category") || "General",
      tags: s("tags").split(",").map((t) => t.trim()),
      language: s("language") || "English",
      page_count: opt("page_count"),
      format: s("format") || "PDF",
      file_size: opt("file_size"),
      description: s("description"),
      highlights: s("highlights").split("\n").map((h) => h.trim()),
      table_of_contents: String(fd.get("table_of_contents") ?? "").replace(/\s+$/, ""),
      price: s("price"),
      old_price: opt("old_price"),
      offer_id: opt("offer_id"),
      rating: s("rating") || 0,
      rating_count: s("rating_count") || 0,
      total_sells: s("total_sells") || 0,
      views: s("views") || 0,
      release_date: opt("release_date"),
      is_featured: fd.get("is_featured") === "on",
      status: s("status") === "published" ? "published" : "draft",
      badge: (["new", "bestseller"].includes(s("badge")) ? s("badge") : "none") as "none" | "new" | "bestseller",
      seo_title: opt("seo_title"),
      seo_description: opt("seo_description"),
      internal_file_note: opt("internal_file_note"),
    };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);
    const fd = new FormData(e.currentTarget);
    const values = readValues(fd);
    const check = bookInputSchema.safeParse(values);
    const fieldErrors: Record<string, string> = {};
    if (!check.success) for (const i of check.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    if (cover && !cover.check.ok) fieldErrors.cover = cover.check.error;
    if (preview && !preview.check.ok) fieldErrors.preview = preview.check.error;
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) {
      setNotice({ tone: "error", text: "Some fields need fixing. They are marked below." });
      return;
    }

    const uploaded: { cover?: string; preview?: string } = {};
    try {
      if (cover?.check.ok) {
        setBusy("Uploading cover…");
        uploaded.cover = await uploadCover(id, cover.file);
      }
      if (preview?.check.ok) {
        setBusy("Uploading preview…");
        uploaded.preview = await uploadPreview(id, preview.file);
      }
      setBusy("Saving…");
      const input: SaveBookInput = {
        id,
        isNew: !book,
        values,
        collectionIds: fd.getAll("collections").map(String),
        cover: uploaded.cover ? { path: uploaded.cover } : removeCover ? { remove: true } : null,
        preview: uploaded.preview ? { path: uploaded.preview } : removePreview ? { remove: true } : null,
      };
      const res = await saveBook(input);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setNotice({ tone: "error", text: res.error });
        return;
      }
      setCover(null);
      setPreview(null);
      setRemoveCover(false);
      setRemovePreview(false);
      setNotice({ tone: "ok", text: res.message ?? "Saved." });
      if (!book) router.replace(`/admin/books/${res.data.id}`);
      else router.refresh();
    } catch (err) {
      // Upload succeeded but the save never ran: remove what we uploaded.
      await discardUploads(id, uploaded).catch(() => undefined);
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Something went wrong. Nothing was saved." });
    } finally {
      setBusy(null);
    }
  }

  const err = (k: string) => errors[k];
  const d = book;

  return (
    <form onSubmit={onSubmit} className="space-y-12 pb-28" noValidate>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <FieldGroup title="Basics" description="What readers see first. The slug becomes the permanent link.">
        <Field label="Title" htmlFor="title" error={err("title")} className="sm:col-span-2">
          <input
            id="title"
            className="input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value, ""));
            }}
            required
          />
        </Field>
        <Field label="Subtitle" htmlFor="subtitle" error={err("subtitle")} className="sm:col-span-2">
          <input id="subtitle" name="subtitle" className="input" defaultValue={d?.subtitle ?? ""} />
        </Field>
        <Field
          label="Slug (link)"
          htmlFor="slug"
          error={err("slug")}
          hint={book ? "Changing it is safe: the old link redirects here forever." : "Filled from the title. Bangla titles need a Latin slug."}
          className="sm:col-span-2"
        >
          <div className="flex items-stretch">
            <span className="micro hidden items-center border-[1.5px] border-r-0 border-ink-3 bg-paper-2 px-3 text-ink-3 sm:flex">/books/</span>
            <input
              id="slug"
              className="input input-mono"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
            />
          </div>
        </Field>
        <Field label="Author" htmlFor="author" error={err("author")}>
          <input id="author" name="author" className="input" defaultValue={d?.author ?? ""} />
        </Field>
        <Field label="Category" htmlFor="category" error={err("category")}>
          <input id="category" name="category" className="input" list="category-list" defaultValue={d?.category ?? ""} />
          <datalist id="category-list">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Language" htmlFor="language" error={err("language")}>
          <input id="language" name="language" className="input" list="language-list" defaultValue={d?.language ?? "English"} />
          <datalist id="language-list">
            {[...new Set(["English", "Bangla", ...languages])].map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </Field>
        <Field label="Tags" htmlFor="tags" hint="Comma separated. Used for search and related books." error={err("tags")}>
          <input id="tags" name="tags" className="input" defaultValue={d?.tags.join(", ") ?? ""} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Price" description="Whole taka. Offers are applied on top automatically; the best single offer wins.">
        <Field label="Price" htmlFor="price" error={err("price")}>
          <input id="price" name="price" type="number" inputMode="numeric" min={0} step="1" className="input input-mono" defaultValue={d?.price ?? ""} required />
        </Field>
        <Field label="Old price (optional)" htmlFor="old_price" hint="Shown struck through when no offer is running." error={err("old_price")}>
          <input id="old_price" name="old_price" type="number" inputMode="numeric" min={0} step="1" className="input input-mono" defaultValue={d?.old_price ?? ""} />
        </Field>
        <Field label="Pinned offer (optional)" htmlFor="offer_id" hint="Applies this offer to the book even if the offer targets other books." error={err("offer_id")} className="sm:col-span-2">
          <select id="offer_id" name="offer_id" className="select" defaultValue={d?.offer_id ?? ""}>
            <option value="">None</option>
            {offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
                {o.is_active ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </Field>
      </FieldGroup>

      <FieldGroup
        title="Files"
        description={`Only the cover and a short preview are uploaded. The full PDF stays on your computer and goes out on WhatsApp.`}
      >
        <div className="sm:col-span-1">
          <p className="field-label">Cover</p>
          <div className="flex gap-4">
            <div className="cover w-24 shrink-0">
              {/* Plain img: a local blob preview that next/image cannot optimise. */}
              {coverSrc && <img src={coverSrc} alt="Cover preview" />}
            </div>
            <div className="min-w-0 space-y-2">
              <input
                id="cover"
                type="file"
                accept={COVER.mimeTypes.join(",")}
                className="block w-full text-small file:mr-3 file:min-h-11 file:border-2 file:border-ink file:bg-paper-raised file:px-3 file:font-semibold"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return setCover(null);
                  setCover({ file: f, check: await checkCover(f) });
                  setRemoveCover(false);
                }}
                aria-describedby="cover-help"
              />
              <p id="cover-help" className="field-hint">
                JPG or PNG, 2:3, at least {COVER.minWidth}px wide, under 2 MB.
              </p>
              {cover && !cover.check.ok && <p className="field-error">{cover.check.error}</p>}
              {cover?.check.ok && cover.check.warning && <p className="field-hint text-ochre-ink">{cover.check.warning}</p>}
              {err("cover") && <p className="field-error">{err("cover")}</p>}
              {book?.cover_path && !cover && (
                <label className="flex min-h-11 items-center gap-2 text-small">
                  <input type="checkbox" className="check" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} />
                  Remove the current cover
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="sm:col-span-1">
          <p className="field-label">Preview PDF</p>
          <input
            id="preview"
            type="file"
            accept="application/pdf,.pdf"
            className="block w-full text-small file:mr-3 file:min-h-11 file:border-2 file:border-ink file:bg-paper-raised file:px-3 file:font-semibold"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return setPreview(null);
              setPreview({ file: f, check: await checkPreview(f) });
              setRemovePreview(false);
            }}
          />
          <p className="field-hint">
            The first {PREVIEW.recommended}. Max {PREVIEW.maxPages} pages and {PREVIEW.maxBytes / 1024 / 1024} MB.
          </p>
          {preview && !preview.check.ok && <p className="field-error">{preview.check.error}</p>}
          {preview?.check.ok && <p className="field-hint text-green-700">Looks good: {preview.check.pages} pages.</p>}
          {err("preview") && <p className="field-error">{err("preview")}</p>}
          {book?.preview_path && !preview && (
            <>
              <p className="micro mt-3 text-ink-2">Current preview: {book.preview_page_count ?? "?"} pages</p>
              <label className="flex min-h-11 items-center gap-2 text-small">
                <input type="checkbox" className="check" checked={removePreview} onChange={(e) => setRemovePreview(e.target.checked)} />
                Remove the current preview
              </label>
            </>
          )}
        </div>
      </FieldGroup>

      <FieldGroup title="Content" description="Plain text. A blank line starts a new paragraph.">
        <Field label="Description" htmlFor="description" error={err("description")} className="sm:col-span-2">
          <textarea id="description" name="description" rows={7} className="textarea" defaultValue={d?.description ?? ""} />
        </Field>
        <Field label="What you get (one per line)" htmlFor="highlights" error={err("highlights")} className="sm:col-span-2">
          <textarea id="highlights" name="highlights" rows={4} className="textarea" defaultValue={d?.highlights.join("\n") ?? ""} />
        </Field>
        <Field label="Table of contents" htmlFor="table_of_contents" error={err("table_of_contents")} className="sm:col-span-2">
          <textarea id="table_of_contents" name="table_of_contents" rows={6} className="textarea font-mono text-[0.95rem]" defaultValue={d?.table_of_contents ?? ""} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Details" description="Facts about the full PDF, shown in the book's colophon.">
        <Field label="Pages (full book)" htmlFor="page_count" error={err("page_count")}>
          <input id="page_count" name="page_count" type="number" min={1} className="input input-mono" defaultValue={d?.page_count ?? ""} />
        </Field>
        <Field label="File size (full book)" htmlFor="file_size" hint="e.g. 8.4 MB" error={err("file_size")}>
          <input id="file_size" name="file_size" className="input input-mono" defaultValue={d?.file_size ?? ""} />
        </Field>
        <Field label="Format" htmlFor="format" error={err("format")}>
          <input id="format" name="format" className="input" defaultValue={d?.format ?? "PDF"} />
        </Field>
        <Field label="Release date" htmlFor="release_date" error={err("release_date")}>
          <input id="release_date" name="release_date" type="date" className="input input-mono" defaultValue={d?.release_date ?? ""} />
        </Field>
        <Field
          label="Private file note"
          htmlFor="internal_file_note"
          hint="Only you see this. Where the full PDF lives on your computer."
          error={err("internal_file_note")}
          className="sm:col-span-2"
        >
          <input id="internal_file_note" name="internal_file_note" className="input input-mono" defaultValue={d?.internal_file_note ?? ""} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Public numbers" description="Display values shown on the site. Real tracked numbers live in Analytics and are never mixed with these.">
        <Field label="Rating (0 to 5)" htmlFor="rating" error={err("rating")}>
          <input id="rating" name="rating" type="number" min={0} max={5} step="0.1" className="input input-mono" defaultValue={d?.rating ?? 0} />
        </Field>
        <Field label="Number of ratings" htmlFor="rating_count" error={err("rating_count")}>
          <input id="rating_count" name="rating_count" type="number" min={0} className="input input-mono" defaultValue={d?.rating_count ?? 0} />
        </Field>
        <Field label="Total sold" htmlFor="total_sells" hint="Goes up by itself when you log a sale." error={err("total_sells")}>
          <input id="total_sells" name="total_sells" type="number" min={0} className="input input-mono" defaultValue={d?.total_sells ?? 0} />
        </Field>
        <Field label="Views" htmlFor="views" hint="Goes up by itself with real visits." error={err("views")}>
          <input id="views" name="views" type="number" min={0} className="input input-mono" defaultValue={d?.views ?? 0} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Status and placement">
        <fieldset className="sm:col-span-2">
          <legend className="field-label">Status</legend>
          <div className="flex flex-wrap gap-6">
            {(["draft", "published"] as const).map((s) => (
              <label key={s} className="flex min-h-11 items-center gap-2">
                <input type="radio" name="status" value={s} defaultChecked={(d?.status ?? "draft") === s} className="check" />
                {s === "draft" ? "Draft (hidden)" : "Published"}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Badge" htmlFor="badge" error={err("badge")}>
          <select id="badge" name="badge" className="select" defaultValue={d?.badge ?? "none"}>
            <option value="none">None</option>
            <option value="new">New</option>
            <option value="bestseller">Bestseller</option>
          </select>
        </Field>
        <label className="flex min-h-11 items-center gap-2 self-end">
          <input type="checkbox" name="is_featured" defaultChecked={d?.is_featured ?? false} className="check" />
          Feature on the front page
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="field-label">Collections</legend>
          {collections.length ? (
            <div className="grid gap-x-6 sm:grid-cols-2">
              {collections.map((c) => (
                <label key={c.id} className="flex min-h-11 items-center gap-2">
                  <input type="checkbox" name="collections" value={c.id} defaultChecked={memberOf.includes(c.id)} className="check" />
                  {c.name}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-small text-ink-3">
              No collections yet. <Link href="/admin/collections" className="link">Create one</Link>.
            </p>
          )}
        </fieldset>
      </FieldGroup>

      <FieldGroup title="Search engines" description="Optional. Left empty, the title and description are used.">
        <Field label="SEO title" htmlFor="seo_title" hint="Up to 70 characters." error={err("seo_title")} className="sm:col-span-2">
          <input id="seo_title" name="seo_title" maxLength={70} className="input" defaultValue={d?.seo_title ?? ""} />
        </Field>
        <Field label="SEO description" htmlFor="seo_description" hint="Up to 170 characters." error={err("seo_description")} className="sm:col-span-2">
          <textarea id="seo_description" name="seo_description" maxLength={170} rows={2} className="textarea min-h-0" defaultValue={d?.seo_description ?? ""} />
        </Field>
      </FieldGroup>

      {/* Save bar: sticky so it is reachable on a phone without scrolling back up. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-ink bg-paper px-4 py-3 lg:left-60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className={cn("micro", busy ? "text-green-700" : "text-ink-3")} aria-live="polite">
            {busy ?? (book ? `${book.book_code} · last saved ${new Date(book.updated_at).toLocaleString("en-GB")}` : "New book")}
          </p>
          <div className="flex gap-2">
            {book?.status === "published" && (
              <Link href={`/books/${book.slug}`} target="_blank" className="btn btn-outline btn-sm">
                <IconExternal size={16} /> View
              </Link>
            )}
            <button type="submit" className="btn btn-primary btn-sm min-w-32" disabled={Boolean(busy)}>
              {busy ? "Working…" : book ? "Save changes" : "Create book"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
