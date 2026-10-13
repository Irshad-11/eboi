"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COVER, PREVIEW } from "@/config/limits";
import { MEDIA_FOLDERS } from "@/config/storage";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { BookRow } from "@/lib/supabase/database.types";
import { coverUrl } from "@/features/books/cover";
import { bookInputSchema, type BookFormValues } from "@/features/books/schema";
import { IconExternal, IconPlus, IconTrash, IconUpload } from "@/components/icons";
import { discardUploads, saveBook, type ReviewInput } from "../actions/books";
import { checkCover, checkPreview, makePreviewThumbs, uploadCover, uploadPreview } from "../uploads";
import { AdminCard } from "./admin-page-head";
import { Field, Toggle } from "./field";
import { Notice } from "./notice";
import { RichTextEditor } from "./rich-text-editor";
import { SeoPanel, seoFromRow, seoToRow, type SeoValue } from "./seo-panel";

type Props = {
  book: BookRow | null;
  collections: { id: string; name: string }[];
  memberOf: string[];
  offers: { id: string; title: string; is_active: boolean }[];
  categories: string[];
  languages: string[];
  reviews: ReviewInput[];
  titleTemplate: string;
};

type FileState<C> = { file: File; check: C } | null;

type State = {
  title: string;
  subtitle: string;
  slug: string;
  author: string;
  category: string;
  language: string;
  tags: string;
  price: string;
  old_price: string;
  offer_id: string;
  description: string;
  highlights: string;
  toc: string;
  page_count: string;
  file_size: string;
  format: string;
  release_date: string;
  internal_file_note: string;
  rating: string;
  rating_count: string;
  total_sells: string;
  views: string;
  status: "draft" | "published";
  badge: "none" | "new" | "bestseller";
  is_featured: boolean;
  cover_alt: string;
  collections: string[];
};

function initial(b: BookRow | null, memberOf: string[]): State {
  return {
    title: b?.title ?? "",
    subtitle: b?.subtitle ?? "",
    slug: b?.slug ?? "",
    author: b?.author ?? "",
    category: b?.category ?? "",
    language: b?.language ?? "English",
    tags: b?.tags.join(", ") ?? "",
    price: b ? String(b.price) : "",
    old_price: b?.old_price != null ? String(b.old_price) : "",
    offer_id: b?.offer_id ?? "",
    description: b?.description ?? "",
    highlights: b?.highlights.join("\n") ?? "",
    toc: b?.table_of_contents ?? "",
    page_count: b?.page_count != null ? String(b.page_count) : "",
    file_size: b?.file_size ?? "",
    format: b?.format ?? "PDF",
    release_date: b?.release_date ?? "",
    internal_file_note: b?.internal_file_note ?? "",
    rating: String(b?.rating ?? 0),
    rating_count: String(b?.rating_count ?? 0),
    total_sells: String(b?.total_sells ?? 0),
    views: String(b?.views ?? 0),
    status: b?.status ?? "draft",
    badge: b?.badge ?? "none",
    is_featured: b?.is_featured ?? false,
    cover_alt: b?.cover_alt ?? "",
    collections: memberOf,
  };
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

/** Plain text of the first paragraph. String-based, so server and browser render the same. */
function textOfFirstParagraph(html: string): string {
  if (!html) return "";
  const first = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(html)?.[1] ?? html;
  return first
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e: string) => ENTITIES[e] ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cut at a word boundary, like the automatic meta description on the site. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 80 ? space : cut.length)}…`;
}

/** Create/edit every book field. Files upload to private storage, then saveBook verifies them. */
export function BookForm({ book, collections, memberOf, offers, categories, languages, reviews: initialReviews, titleTemplate }: Props) {
  const router = useRouter();
  const [id] = useState(() => book?.id ?? crypto.randomUUID());
  const [s, setS] = useState<State>(() => initial(book, memberOf));
  const [slugTouched, setSlugTouched] = useState(Boolean(book));
  const [seo, setSeo] = useState<SeoValue>(() => seoFromRow(book));
  const [reviews, setReviews] = useState<ReviewInput[]>(initialReviews);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [cover, setCover] = useState<FileState<Awaited<ReturnType<typeof checkCover>>>>(null);
  const [preview, setPreview] = useState<FileState<Awaited<ReturnType<typeof checkPreview>>>>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [removePreview, setRemovePreview] = useState(false);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  const coverSrc = useMemo(() => {
    if (cover?.file) return URL.createObjectURL(cover.file);
    return book && !removeCover ? coverUrl(book) : null;
  }, [cover, book, removeCover]);

  const values = (): BookFormValues => {
    const row = seoToRow(seo);
    return {
      title: s.title,
      subtitle: s.subtitle || null,
      slug: s.slug || slugify(s.title),
      author: s.author,
      category: s.category || "General",
      tags: s.tags.split(",").map((t) => t.trim()),
      language: s.language || "English",
      page_count: s.page_count || null,
      format: s.format || "PDF",
      file_size: s.file_size || null,
      description: s.description,
      highlights: s.highlights.split("\n").map((h) => h.trim()),
      table_of_contents: s.toc.replace(/\s+$/, ""),
      price: s.price,
      old_price: s.old_price || null,
      offer_id: s.offer_id || null,
      rating: s.rating || 0,
      rating_count: s.rating_count || 0,
      total_sells: s.total_sells || 0,
      views: s.views || 0,
      release_date: s.release_date || null,
      is_featured: s.is_featured,
      status: s.status,
      badge: s.badge,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      focus_keyword: row.focus_keyword,
      seo_keywords: row.seo_keywords,
      canonical_url: row.canonical_url,
      noindex: row.noindex,
      cover_alt: s.cover_alt || null,
      internal_file_note: s.internal_file_note || null,
    };
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const v = values();
    const check = bookInputSchema.safeParse(v);
    const fe: Record<string, string> = {};
    if (!check.success) for (const i of check.error.issues) fe[String(i.path[0])] ??= i.message;
    if (cover && !cover.check.ok) fe.cover = cover.check.error;
    if (preview && !preview.check.ok) fe.preview = preview.check.error;
    reviews.forEach((r, i) => {
      if (!r.author_name.trim()) fe[`review-${i}`] = "Add a name";
    });
    setErrors(fe);
    if (Object.keys(fe).length) {
      setNotice({ tone: "error", text: "Some fields need fixing. They are marked below." });
      return;
    }

    const uploaded: { cover?: string; preview?: string; thumbs?: string[] } = {};
    try {
      if (cover?.check.ok) {
        setBusy("Uploading cover…");
        uploaded.cover = await uploadCover(id, cover.file);
      }
      if (preview?.check.ok) {
        setBusy("Uploading preview…");
        uploaded.preview = await uploadPreview(id, preview.file);
        setBusy("Making preview thumbnails…");
        uploaded.thumbs = await makePreviewThumbs(id, preview.file).catch(() => []);
      }
      setBusy("Saving…");
      const ogChanged = (book?.og_image_path ?? null) !== seo.og_image_path;
      const res = await saveBook({
        id,
        isNew: !book,
        values: v,
        collectionIds: s.collections,
        cover: uploaded.cover ? { path: uploaded.cover } : removeCover ? { remove: true } : null,
        preview: uploaded.preview ? { path: uploaded.preview } : removePreview ? { remove: true } : null,
        thumbs: uploaded.thumbs ?? null,
        ogImage: ogChanged ? seo.og_image_path : undefined,
        reviews,
      });
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
      await discardUploads(id, uploaded).catch(() => undefined);
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Something went wrong. Nothing was saved." });
    } finally {
      setBusy(null);
    }
  }

  const err = (k: string) => errors[k];
  const input = (k: keyof State, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input id={`b-${k}`} className="input" value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} aria-invalid={Boolean(err(k)) || undefined} {...extra} />
  );

  return (
    <form onSubmit={onSubmit} className="pb-24" noValidate>
      {notice && <Notice tone={notice.tone} className="mb-4">{notice.text}</Notice>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-4">
          <AdminCard title="Book">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="b-title" error={err("title")} className="sm:col-span-2">
                <input
                  id="b-title"
                  className="input"
                  value={s.title}
                  aria-invalid={Boolean(err("title")) || undefined}
                  onChange={(e) => {
                    set("title", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value, ""));
                  }}
                />
              </Field>
              <Field label="Subtitle" htmlFor="b-subtitle" error={err("subtitle")} className="sm:col-span-2">
                {input("subtitle")}
              </Field>
              <Field label="URL slug" htmlFor="b-slug" error={err("slug")} hint={book ? "Old links redirect if you change it." : "Bangla titles need a Latin slug."} className="sm:col-span-2">
                <div className="flex items-stretch">
                  <span className="hidden items-center rounded-l-md border border-r-0 border-line-2 bg-muted px-3 text-sm text-text-3 sm:flex">/books/</span>
                  <input
                    id="b-slug"
                    className="input sm:rounded-l-none"
                    value={s.slug}
                    aria-invalid={Boolean(err("slug")) || undefined}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", e.target.value.toLowerCase());
                    }}
                  />
                </div>
              </Field>
              <Field label="Author" htmlFor="b-author" error={err("author")}>
                {input("author")}
              </Field>
              <Field label="Category" htmlFor="b-category" error={err("category")}>
                {input("category", { list: "category-list" })}
                <datalist id="category-list">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="Language" htmlFor="b-language" error={err("language")}>
                {input("language", { list: "language-list" })}
                <datalist id="language-list">
                  {[...new Set(["English", "Bangla", ...languages])].map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </Field>
              <Field label="Tags" htmlFor="b-tags" hint="Comma separated" error={err("tags")}>
                {input("tags")}
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="Description">
            <RichTextEditor id="b-description" value={s.description} onChange={(html) => set("description", html)} invalid={Boolean(err("description"))} />
            {err("description") && <p className="field-error">{err("description")}</p>}
          </AdminCard>

          <AdminCard title="Highlights and contents">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Highlights" htmlFor="b-highlights" hint="One per line. Shown next to the price." error={err("highlights")}>
                <textarea id="b-highlights" rows={6} className="textarea" value={s.highlights} onChange={(e) => set("highlights", e.target.value)} />
              </Field>
              <Field label="Table of contents" htmlFor="b-toc" hint="One chapter per line" error={err("table_of_contents")}>
                <textarea id="b-toc" rows={6} className="textarea" value={s.toc} onChange={(e) => set("toc", e.target.value)} />
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pages (full book)" htmlFor="b-page_count" error={err("page_count")}>
                {input("page_count", { type: "number", min: 1, inputMode: "numeric" })}
              </Field>
              <Field label="File size (full book)" htmlFor="b-file_size" hint="e.g. 8.4 MB" error={err("file_size")}>
                {input("file_size")}
              </Field>
              <Field label="Format" htmlFor="b-format" error={err("format")}>
                {input("format")}
              </Field>
              <Field label="Release date" htmlFor="b-release_date" error={err("release_date")}>
                {input("release_date", { type: "date" })}
              </Field>
              <Field label="Private file note" htmlFor="b-internal_file_note" hint="Only you see this" error={err("internal_file_note")} className="sm:col-span-2">
                {input("internal_file_note")}
              </Field>
            </div>
          </AdminCard>

          <AdminCard
            title="Reviews"
            actions={
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReviews((r) => [...r, { author_name: "", rating: 5, body: "", review_date: new Date().toISOString().slice(0, 10), is_visible: true }])}
              >
                <IconPlus size={16} /> Add review
              </button>
            }
          >
            {reviews.length === 0 ? (
              <p className="text-sm text-text-3">No reviews.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((r, i) => {
                  const upd = (patch: Partial<ReviewInput>) => setReviews((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                  return (
                    <li key={i} className="rounded-md border border-line p-3">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_10rem_auto]">
                        <Field label="Name" htmlFor={`rv-name-${i}`} error={err(`review-${i}`)}>
                          <input id={`rv-name-${i}`} className="input" value={r.author_name} onChange={(e) => upd({ author_name: e.target.value })} />
                        </Field>
                        <Field label="Rating" htmlFor={`rv-rating-${i}`}>
                          <select id={`rv-rating-${i}`} className="select" value={String(r.rating)} onChange={(e) => upd({ rating: Number(e.target.value) })}>
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={n}>
                                {n} ★
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Date" htmlFor={`rv-date-${i}`}>
                          <input id={`rv-date-${i}`} type="date" className="input" value={r.review_date} onChange={(e) => upd({ review_date: e.target.value })} />
                        </Field>
                        <div className="flex items-end">
                          <button type="button" className="btn btn-ghost btn-icon text-sale hover:text-sale" aria-label="Remove review" onClick={() => setReviews((list) => list.filter((_, j) => j !== i))}>
                            <IconTrash size={18} />
                          </button>
                        </div>
                      </div>
                      <Field label="Review" htmlFor={`rv-body-${i}`} className="mt-3">
                        <textarea id={`rv-body-${i}`} rows={2} className="textarea min-h-16" value={r.body ?? ""} onChange={(e) => upd({ body: e.target.value })} />
                      </Field>
                      <div className="mt-2">
                        <Toggle id={`rv-vis-${i}`} label="Show on the site" checked={r.is_visible !== false} onChange={(c) => upd({ is_visible: c })} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="Search engines">
            <SeoPanel
              idPrefix="b-seo"
              value={seo}
              onChange={setSeo}
              autoTitle={`${s.title || "Book title"}${s.author ? ` by ${s.author}` : ""} (PDF)`}
              autoDescription={clip((s.subtitle ? `${s.subtitle}. ` : "") + textOfFirstParagraph(s.description), 155)}
              path={`/books/${s.slug || "book"}`}
              slug={s.slug}
              firstParagraph={textOfFirstParagraph(s.description)}
              coverAlt={s.cover_alt}
              titleTemplate={titleTemplate}
              og={{ folder: MEDIA_FOLDERS.seo, ownerId: id }}
              errors={errors}
            />
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard title="Status">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Status">
                {(["draft", "published"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    role="radio"
                    aria-checked={s.status === st}
                    onClick={() => set("status", st)}
                    className={cn("btn btn-sm", s.status === st ? (st === "published" ? "btn-primary" : "btn-secondary border-brand text-brand") : "btn-secondary")}
                  >
                    {st === "draft" ? "Draft" : "Published"}
                  </button>
                ))}
              </div>
              <Field label="Badge" htmlFor="b-badge">
                <select id="b-badge" className="select" value={s.badge} onChange={(e) => set("badge", e.target.value as State["badge"])}>
                  <option value="none">None</option>
                  <option value="new">New</option>
                  <option value="bestseller">Bestseller</option>
                </select>
              </Field>
              <Toggle id="b-featured" label="Featured" hint="Listed first in the shop" checked={s.is_featured} onChange={(c) => set("is_featured", c)} />
            </div>
          </AdminCard>

          <AdminCard title="Price">
            <div className="space-y-3">
              <Field label="Price" htmlFor="b-price" error={err("price")}>
                {input("price", { type: "number", min: 0, step: 1, inputMode: "numeric" })}
              </Field>
              <Field label="Old price" htmlFor="b-old_price" hint="Shown struck through when no offer runs" error={err("old_price")}>
                {input("old_price", { type: "number", min: 0, step: 1, inputMode: "numeric" })}
              </Field>
              <Field label="Linked offer" htmlFor="b-offer_id" error={err("offer_id")}>
                <select id="b-offer_id" className="select" value={s.offer_id} onChange={(e) => set("offer_id", e.target.value)}>
                  <option value="">None</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                      {o.is_active ? "" : " (off)"}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="Cover">
            <div className="flex gap-3">
              <div className="cover-frame w-24 shrink-0">
                {/* Plain img: a local blob or admin-only cover the optimizer cannot fetch. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
                {coverSrc && <img src={coverSrc} alt="" />}
              </div>
              <div className="min-w-0 space-y-2">
                <label htmlFor="b-cover" className="btn btn-secondary btn-sm cursor-pointer">
                  <IconUpload size={16} />
                  {book?.cover_path || cover ? "Replace" : "Upload"}
                </label>
                <input
                  id="b-cover"
                  type="file"
                  accept={COVER.mimeTypes.join(",")}
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return setCover(null);
                    setCover({ file: f, check: await checkCover(f) });
                    setRemoveCover(false);
                  }}
                />
                <p className="field-hint mt-0">JPG/PNG, 2:3, ≥{COVER.minWidth}px wide, ≤2 MB</p>
                {cover && !cover.check.ok && <p className="field-error">{cover.check.error}</p>}
                {cover?.check.ok && cover.check.warning && <p className="field-hint text-warn">{cover.check.warning}</p>}
                {err("cover") && <p className="field-error">{err("cover")}</p>}
                {book?.cover_path && !cover && (
                  <Toggle id="b-remove-cover" label="Remove cover" checked={removeCover} onChange={setRemoveCover} />
                )}
              </div>
            </div>
            <Field label="Cover alt text" htmlFor="b-cover_alt" hint="Describes the cover for screen readers and Google" error={err("cover_alt")} className="mt-3">
              {input("cover_alt")}
            </Field>
          </AdminCard>

          <AdminCard title="Free preview">
            <label htmlFor="b-preview" className="btn btn-secondary btn-sm cursor-pointer">
              <IconUpload size={16} />
              {book?.preview_path || preview ? "Replace PDF" : "Upload PDF"}
            </label>
            <input
              id="b-preview"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return setPreview(null);
                setPreview({ file: f, check: await checkPreview(f) });
                setRemovePreview(false);
              }}
            />
            <p className="field-hint">
              First {PREVIEW.recommended}, max {PREVIEW.maxPages} pages and {PREVIEW.maxBytes / 1024 / 1024} MB
            </p>
            {preview && !preview.check.ok && <p className="field-error">{preview.check.error}</p>}
            {preview?.check.ok && <p className="field-hint text-brand">{preview.check.pages} pages, ready to upload</p>}
            {err("preview") && <p className="field-error">{err("preview")}</p>}
            {book?.preview_path && !preview && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-text-2">
                  Current: {book.preview_page_count ?? "?"} pages, {book.preview_thumbs?.length ?? 0} thumbnails
                </p>
                <Toggle id="b-remove-preview" label="Remove preview" checked={removePreview} onChange={setRemovePreview} />
              </div>
            )}
          </AdminCard>

          <AdminCard title="Collections">
            {collections.length ? (
              <ul className="space-y-0.5">
                {collections.map((c) => (
                  <li key={c.id}>
                    <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-md px-1 hover:bg-muted">
                      <input
                        type="checkbox"
                        className="check"
                        checked={s.collections.includes(c.id)}
                        onChange={(e) => set("collections", e.target.checked ? [...s.collections, c.id] : s.collections.filter((x) => x !== c.id))}
                      />
                      <span className="text-base">{c.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <Link href="/admin/collections/new" className="link text-sm">
                Create a collection
              </Link>
            )}
          </AdminCard>

          <AdminCard title="Shown on the site" description="Display values. Real numbers are in Analytics.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rating (0–5)" htmlFor="b-rating" error={err("rating")}>
                {input("rating", { type: "number", min: 0, max: 5, step: 0.1 })}
              </Field>
              <Field label="Ratings" htmlFor="b-rating_count" error={err("rating_count")}>
                {input("rating_count", { type: "number", min: 0 })}
              </Field>
              <Field label="Sold" htmlFor="b-total_sells" error={err("total_sells")}>
                {input("total_sells", { type: "number", min: 0 })}
              </Field>
              <Field label="Views" htmlFor="b-views" error={err("views")}>
                {input("views", { type: "number", min: 0 })}
              </Field>
            </div>
          </AdminCard>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 py-3 shadow-[0_-4px_14px_rgb(16_24_20/0.06)] lg:left-[15.5rem]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="truncate text-sm text-text-3" aria-live="polite">
            {busy ?? (book ? `${book.book_code} · saved ${formatDate(book.updated_at)}` : "New book")}
          </p>
          <div className="flex shrink-0 gap-2">
            {book?.status === "published" && (
              <Link href={`/books/${book.slug}`} target="_blank" className="btn btn-secondary">
                <IconExternal size={16} />
                <span className="hidden sm:inline">View</span>
              </Link>
            )}
            <button type="submit" className="btn btn-primary" data-loading={Boolean(busy)} disabled={Boolean(busy)}>
              {book ? "Save" : "Create book"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
