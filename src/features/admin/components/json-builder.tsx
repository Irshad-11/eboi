"use client";

import { useMemo, useState } from "react";
import { publicEnv } from "@/lib/env";
import { slugify } from "@/lib/slug";
import { IconCheck, IconCopy, IconDownload, IconUpload } from "@/components/icons";
import { bookJsonSchema } from "@/features/books/schema";
import { BOOK_JSON_SCHEMA_URL } from "@/features/books/json";
import { copyText } from "@/features/whatsapp/copy";
import { AdminCard } from "./admin-page-head";
import { Field, Toggle } from "./field";
import { ListEditor } from "./list-editor";

type Review = { author_name: string; rating: number; body: string; review_date: string };

type Form = {
  title: string;
  subtitle: string;
  slug: string;
  book_code: string;
  author: string;
  category: string;
  language: string;
  tags: string;
  price: string;
  old_price: string;
  price_usd: string;
  page_count: string;
  file_size: string;
  release_date: string;
  status: "draft" | "published";
  badge: "none" | "new" | "bestseller";
  is_featured: boolean;
  description: string;
  highlights: string;
  toc: string;
  collections: string[];
  cover_file: string;
  preview_file: string;
  cover_alt: string;
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  reviews: Review[];
};

const EMPTY: Form = {
  title: "",
  subtitle: "",
  slug: "",
  book_code: "",
  author: "",
  category: "",
  language: "English",
  tags: "",
  price: "",
  old_price: "",
  price_usd: "",
  page_count: "",
  file_size: "",
  release_date: "",
  status: "draft",
  badge: "none",
  is_featured: false,
  description: "",
  highlights: "",
  toc: "",
  collections: [],
  cover_file: "",
  preview_file: "",
  cover_alt: "",
  seo_title: "",
  seo_description: "",
  focus_keyword: "",
  reviews: [],
};

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Plain text with blank lines -> <p> paragraphs (HTML is kept as it is). */
const toHtml = (t: string) =>
  /<[a-z][\s\S]*>/i.test(t)
    ? t.trim()
    : t
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
        .join("");
const lines = (t: string) =>
  t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
const num = (v: string) => (v.trim() === "" ? null : Number(v));

/** The JSON object, with empty optional fields left out. */
function buildJson(f: Form) {
  const out: Record<string, unknown> = {
    $schema: `${publicEnv.siteUrl}${BOOK_JSON_SCHEMA_URL}`,
    format_version: 1,
  };
  if (f.book_code.trim()) out.book_code = f.book_code.trim().toUpperCase();
  out.slug = f.slug.trim() || slugify(f.title);
  out.title = f.title.trim();
  if (f.subtitle.trim()) out.subtitle = f.subtitle.trim();
  if (f.author.trim()) out.author = f.author.trim();
  if (f.category.trim()) out.category = f.category.trim();
  const tags = f.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.length) out.tags = tags;
  out.language = f.language.trim() || "English";
  if (num(f.page_count) != null) out.page_count = num(f.page_count);
  out.format = "PDF";
  if (f.file_size.trim()) out.file_size = f.file_size.trim();
  if (f.description.trim()) out.description = toHtml(f.description);
  if (lines(f.highlights).length) out.highlights = lines(f.highlights);
  if (f.toc.trim()) out.table_of_contents = lines(f.toc).join("\n");
  out.price = num(f.price) ?? 0;
  if (num(f.old_price) != null) out.old_price = num(f.old_price);
  if (num(f.price_usd) != null) out.price_usd = num(f.price_usd);
  if (f.release_date) out.release_date = f.release_date;
  out.status = f.status;
  out.badge = f.badge;
  out.is_featured = f.is_featured;
  if (f.seo_title.trim()) out.seo_title = f.seo_title.trim();
  if (f.seo_description.trim()) out.seo_description = f.seo_description.trim();
  if (f.focus_keyword.trim()) out.focus_keyword = f.focus_keyword.trim();
  if (f.cover_alt.trim()) out.cover_alt = f.cover_alt.trim();
  if (f.collections.length) out.collections = f.collections;
  if (f.reviews.length) out.reviews = f.reviews.map((r) => ({ ...r, is_visible: true }));
  if (f.cover_file.trim() || f.preview_file.trim()) {
    out.files = {
      ...(f.cover_file.trim() ? { cover: f.cover_file.trim() } : {}),
      ...(f.preview_file.trim() ? { preview: f.preview_file.trim() } : {}),
    };
  }
  return out;
}

/**
 * Admin > Import: fill in a form, get a ready book JSON. Copy it, download
 * it as a .json file, or send it straight to the import above.
 */
export function JsonBuilder({
  collections,
  categories,
  onUse,
}: {
  collections: { slug: string; name: string }[];
  categories: string[];
  onUse: (data: unknown, name: string) => void;
}) {
  const [f, setF] = useState<Form>(EMPTY);
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const json = useMemo(() => buildJson(f), [f]);
  const text = useMemo(() => JSON.stringify(json, null, 2), [json]);
  const check = useMemo(() => bookJsonSchema.safeParse(json), [json]);
  const problems = check.success ? [] : [...new Set(check.error.issues.map((i) => `${i.path.join(".") || "book"}: ${i.message}`))].slice(0, 6);
  const ready = f.title.trim() !== "" && f.price.trim() !== "" && check.success;
  const fileName = `${String(json.slug || "book")}.json`;

  const text1 = (k: keyof Form, label: string, extra?: { hint?: string; placeholder?: string; type?: string; className?: string; list?: string }) => (
    <Field label={label} htmlFor={`jb-${k}`} hint={extra?.hint} className={extra?.className}>
      <input
        id={`jb-${k}`}
        className="input"
        type={extra?.type ?? "text"}
        placeholder={extra?.placeholder}
        list={extra?.list}
        step={extra?.type === "number" ? "any" : undefined}
        value={f[k] as string}
        onChange={(e) => set(k, e.target.value as never)}
      />
    </Field>
  );

  return (
    <AdminCard title="Build a book JSON" description="Fill in the book, then copy the JSON, download it as a file, or send it straight to the import above. Only the title and price are required.">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {text1("title", "Title *", { className: "sm:col-span-2" })}
            {text1("subtitle", "Subtitle", { className: "sm:col-span-2" })}
            {text1("slug", "Link name (slug)", { hint: `Empty = ${slugify(f.title || "book")}` })}
            {text1("book_code", "Book ID", { hint: "Empty = next free ID. An existing ID updates that book.", placeholder: "EB-0042" })}
            {text1("author", "Author")}
            {text1("category", "Category", { list: "jb-categories" })}
            <datalist id="jb-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {text1("language", "Language")}
            {text1("tags", "Tags", { hint: "Comma separated" })}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {text1("price", "Price (৳) *", { type: "number" })}
            {text1("old_price", "Old price (৳)", { type: "number" })}
            {text1("price_usd", "Dollar price (US$)", { type: "number", placeholder: "2.99" })}
            {text1("page_count", "Pages", { type: "number" })}
            {text1("file_size", "File size", { placeholder: "4.2 MB" })}
            {text1("release_date", "Release date", { type: "date" })}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Status" htmlFor="jb-status">
              <select id="jb-status" className="select" value={f.status} onChange={(e) => set("status", e.target.value as Form["status"])}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
            <Field label="Badge" htmlFor="jb-badge">
              <select id="jb-badge" className="select" value={f.badge} onChange={(e) => set("badge", e.target.value as Form["badge"])}>
                <option value="none">None</option>
                <option value="new">New</option>
                <option value="bestseller">Bestseller</option>
              </select>
            </Field>
            <div className="flex items-end pb-2">
              <Toggle id="jb-featured" label="Featured" checked={f.is_featured} onChange={(c) => set("is_featured", c)} />
            </div>
          </div>

          <Field label="Description" htmlFor="jb-description" hint="Plain text: leave a blank line between paragraphs.">
            <textarea id="jb-description" rows={5} className="textarea" value={f.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Highlights" htmlFor="jb-highlights" hint="One per line">
              <textarea id="jb-highlights" rows={4} className="textarea" value={f.highlights} onChange={(e) => set("highlights", e.target.value)} />
            </Field>
            <Field label="Contents" htmlFor="jb-toc" hint="One chapter per line">
              <textarea id="jb-toc" rows={4} className="textarea" value={f.toc} onChange={(e) => set("toc", e.target.value)} />
            </Field>
          </div>

          {collections.length > 0 && (
            <fieldset>
              <legend className="field-label">Collections</legend>
              <div className="flex flex-wrap gap-2">
                {collections.map((c) => {
                  const on = f.collections.includes(c.slug);
                  return (
                    <label key={c.slug} className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${on ? "border-brand bg-brand-soft text-brand-ink" : "border-line-2 hover:border-brand"}`}>
                      <input
                        type="checkbox"
                        className="check"
                        checked={on}
                        onChange={(e) => set("collections", e.target.checked ? [...f.collections, c.slug] : f.collections.filter((x) => x !== c.slug))}
                      />
                      {c.name}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {text1("cover_file", "Cover file name", { hint: "The image you will attach, e.g. my-book-cover.jpg" })}
            {text1("preview_file", "Preview PDF file name", { hint: "e.g. my-book-preview.pdf" })}
            {text1("cover_alt", "Cover alt text", { className: "sm:col-span-2" })}
            {text1("seo_title", "SEO title")}
            {text1("focus_keyword", "Focus keyword")}
            {text1("seo_description", "SEO description", { className: "sm:col-span-2" })}
          </div>

          <div>
            <p className="field-label">Reviews (optional)</p>
            <ListEditor<Review>
              items={f.reviews}
              onChange={(v) => set("reviews", v)}
              blank={() => ({ author_name: "", rating: 5, body: "", review_date: new Date().toISOString().slice(0, 10) })}
              addLabel="Add review"
              max={20}
              render={(r, upd, i) => (
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_9.5rem]">
                  <input aria-label={`Review ${i + 1} name`} placeholder="Name" className="input" value={r.author_name} onChange={(e) => upd({ author_name: e.target.value })} />
                  <select aria-label={`Review ${i + 1} stars`} className="select" value={r.rating} onChange={(e) => upd({ rating: Number(e.target.value) })}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ★
                      </option>
                    ))}
                  </select>
                  <input aria-label={`Review ${i + 1} date`} type="date" className="input" value={r.review_date} onChange={(e) => upd({ review_date: e.target.value })} />
                  <textarea aria-label={`Review ${i + 1} text`} rows={2} placeholder="What they said" className="textarea sm:col-span-3" value={r.body} onChange={(e) => upd({ body: e.target.value })} />
                </div>
              )}
            />
          </div>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <p className="field-label">Your JSON</p>
          <pre className="max-h-[28rem] overflow-auto rounded-md bg-[#1f2622] p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-[#d9f2e3]">{text}</pre>
          {problems.length > 0 && f.title.trim() !== "" && (
            <ul className="mt-2 space-y-0.5 text-sm text-sale">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!f.title.trim()}
              onClick={async () => {
                if (await copyText(text)) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              {copied ? <IconCheck size={18} className="text-brand" /> : <IconCopy size={18} />}
              {copied ? "Copied" : "Copy JSON"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!f.title.trim()}
              onClick={() => {
                const url = URL.createObjectURL(new Blob([`${text}\n`], { type: "application/json" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              <IconDownload size={18} />
              Download .json
            </button>
            <button type="button" className="btn btn-primary sm:col-span-2" disabled={!ready} onClick={() => onUse(json, fileName)}>
              <IconUpload size={18} />
              Use in the import above
            </button>
            <button type="button" className="btn btn-ghost btn-sm sm:col-span-2" onClick={() => setF(EMPTY)}>
              Start over
            </button>
          </div>
        </div>
      </div>
    </AdminCard>
  );
}
