"use client";

import { useState, useTransition } from "react";
import { announcePreviewChange } from "./preview-panel";
import { useRouter } from "next/navigation";
import { MEDIA_FOLDERS } from "@/config/storage";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/cn";
import type { PageKey, PageSeoRow, RedirectRow } from "@/lib/supabase/database.types";
import type { SiteSettings } from "@/features/settings/schema";
import { IconChevronDown, IconEdit, IconPlus, IconTrash } from "@/components/icons";
import { deleteRedirect, savePageSeo, saveRedirect, saveSeoSettings } from "../actions/settings";
import { PAGE_MEDIA_OWNER, SITE_MEDIA_OWNER } from "../media-owners";
import { AdminCard } from "./admin-page-head";
import { Field, Toggle } from "./field";
import { ImageUpload } from "./image-upload";
import { Notice } from "./notice";
import { SeoPanel, seoFromRow, seoToRow, type SeoValue } from "./seo-panel";

type PageInfo = { key: PageKey; label: string; path: string; autoTitle: string; autoDescription: string };

/** Site-wide SEO and verification codes. */
export function SiteSeoForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [v, setV] = useState({
    title_template: settings.title_template,
    default_meta_description: settings.default_meta_description,
    default_keywords: settings.default_keywords.join(", "),
    site_noindex: settings.site_noindex,
    google_verification: settings.google_verification,
    bing_verification: settings.bing_verification,
    default_og_image_path: settings.default_og_image_path,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }));

  return (
    <AdminCard title="Whole site">
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await saveSeoSettings({
              ...v,
              default_keywords: v.default_keywords
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean),
            });
            setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
            setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
            if (res.ok) {
              router.refresh();
              announcePreviewChange();
            }
          });
        }}
      >
        {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title template" htmlFor="seo-tpl" hint="%s is replaced by the page title" error={errors.title_template}>
            <input id="seo-tpl" className="input" value={v.title_template} onChange={(e) => set("title_template", e.target.value)} />
          </Field>
          <Field label="Default keywords" htmlFor="seo-kw" hint="Comma separated" error={errors.default_keywords}>
            <input id="seo-kw" className="input" value={v.default_keywords} onChange={(e) => set("default_keywords", e.target.value)} />
          </Field>
          <Field label="Default meta description" htmlFor="seo-desc" hint={`${v.default_meta_description.length} characters (best 110–160)`} error={errors.default_meta_description} className="sm:col-span-2">
            <textarea id="seo-desc" rows={2} className="textarea min-h-16" value={v.default_meta_description} onChange={(e) => set("default_meta_description", e.target.value)} />
          </Field>
          <Field label="Google Search Console code" htmlFor="seo-google" hint="Paste the code or the whole google-site-verification text" error={errors.google_verification}>
            <input id="seo-google" className="input" value={v.google_verification} onChange={(e) => set("google_verification", e.target.value)} />
          </Field>
          <Field label="Bing Webmaster code" htmlFor="seo-bing" hint="Optional (msvalidate.01)" error={errors.bing_verification}>
            <input id="seo-bing" className="input" value={v.bing_verification} onChange={(e) => set("bing_verification", e.target.value)} />
          </Field>
          <ImageUpload
            id="seo-og"
            label="Default share image"
            hint="1200 × 630, used for the home page"
            folder={MEDIA_FOLDERS.seo}
            ownerId={SITE_MEDIA_OWNER}
            value={v.default_og_image_path}
            onChange={(p) => set("default_og_image_path", p)}
            aspect="1200 / 630"
          />
          <div>
            <Toggle id="seo-noindex" label="Hide the whole site from search engines" hint="Only for testing. Turn off before launch." checked={v.site_noindex} onChange={(c) => set("site_noindex", c)} />
          </div>
        </div>
        <button className="btn btn-primary" data-loading={pending} disabled={pending}>
          Save
        </button>
      </form>
    </AdminCard>
  );
}

/** Per-page SEO, one collapsible panel per fixed page. */
export function PageSeoList({ pages, rows, titleTemplate }: { pages: PageInfo[]; rows: PageSeoRow[]; titleTemplate: string }) {
  const [open, setOpen] = useState<PageKey | null>(null);
  const byKey = new Map(rows.map((r) => [r.page_key, r]));
  return (
    <AdminCard title="Pages">
      <ul className="divide-y divide-line rounded-md border border-line">
        {pages.map((p) => (
          <li key={p.key}>
            <button type="button" onClick={() => setOpen((o) => (o === p.key ? null : p.key))} aria-expanded={open === p.key} className="flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left hover:bg-muted">
              <span>
                <span className="text-base font-semibold">{p.label}</span>
                <span className="ml-2 text-sm text-text-3">{p.path}</span>
              </span>
              <IconChevronDown size={18} className={cn("text-text-3 transition-transform", open === p.key && "rotate-180")} />
            </button>
            {open === p.key && <PageSeoEditor page={p} row={byKey.get(p.key) ?? null} titleTemplate={titleTemplate} />}
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}

function PageSeoEditor({ page, row, titleTemplate }: { page: PageInfo; row: PageSeoRow | null; titleTemplate: string }) {
  const router = useRouter();
  const [seo, setSeo] = useState<SeoValue>(() => seoFromRow(row));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-4 border-t border-line p-3 md:p-4">
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <SeoPanel
        idPrefix={`ps-${page.key}`}
        value={seo}
        onChange={setSeo}
        autoTitle={page.autoTitle}
        autoDescription={page.autoDescription}
        path={page.path}
        titleTemplate={titleTemplate}
        applyTemplate={page.key !== "home"}
        og={{ folder: MEDIA_FOLDERS.seo, ownerId: PAGE_MEDIA_OWNER[page.key] }}
        errors={errors}
      />
      <button
        type="button"
        className="btn btn-primary"
        data-loading={pending}
        onClick={() =>
          start(async () => {
            const res = await savePageSeo(page.key, seoToRow(seo));
            setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
            setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
            if (res.ok) {
              router.refresh();
              announcePreviewChange();
            }
          })
        }
      >
        Save {page.label}
      </button>
    </div>
  );
}

/** Manual 301/302 redirects, on top of the automatic slug-change redirects. */
export function RedirectsManager({ redirects }: { redirects: RedirectRow[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<{ id: string | null; source_path: string; destination: string; status_code: 301 | 302; is_active: boolean } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const host = publicEnv.siteUrl;

  return (
    <AdminCard
      title="Redirects"
      description="Changing a book or collection slug redirects automatically. Add others here."
      actions={
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEdit({ id: null, source_path: "/", destination: "/", status_code: 301, is_active: true })}>
          <IconPlus size={16} /> Add redirect
        </button>
      }
    >
      {notice && <Notice tone={notice.tone} className="mb-3">{notice.text}</Notice>}
      {edit && (
        <div className="mb-4 space-y-3 rounded-md border border-line bg-muted p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem]">
            <Field label="From path" htmlFor="rd-from" error={errors.source_path}>
              <input id="rd-from" className="input" value={edit.source_path} onChange={(e) => setEdit({ ...edit, source_path: e.target.value })} />
            </Field>
            <Field label="To" htmlFor="rd-to" error={errors.destination}>
              <input id="rd-to" className="input" value={edit.destination} onChange={(e) => setEdit({ ...edit, destination: e.target.value })} />
            </Field>
            <Field label="Type" htmlFor="rd-type">
              <select id="rd-type" className="select" value={edit.status_code} onChange={(e) => setEdit({ ...edit, status_code: Number(e.target.value) as 301 | 302 })}>
                <option value={301}>301 permanent</option>
                <option value={302}>302 temporary</option>
              </select>
            </Field>
          </div>
          <Toggle id="rd-active" label="Active" checked={edit.is_active} onChange={(c) => setEdit({ ...edit, is_active: c })} />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              data-loading={pending}
              onClick={() =>
                start(async () => {
                  const { id, ...values } = edit;
                  const res = await saveRedirect(id, values);
                  setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
                  setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
                  if (res.ok) {
                    setEdit(null);
                    router.refresh();
                    announcePreviewChange();
                  }
                })
              }
            >
              Save redirect
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {redirects.length === 0 ? (
        <p className="text-sm text-text-3">No manual redirects.</p>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line">
          {redirects.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate">
                  <span className="font-semibold">{r.source_path}</span> → {r.destination.startsWith("/") ? `${host}${r.destination}` : r.destination}
                </p>
                <p className="text-text-3">
                  {r.status_code} {r.is_active ? "" : "· off"}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`Edit redirect from ${r.source_path}`} onClick={() => setEdit({ id: r.id, source_path: r.source_path, destination: r.destination, status_code: r.status_code, is_active: r.is_active })}>
                <IconEdit size={16} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm text-sale hover:text-sale"
                aria-label={`Delete redirect from ${r.source_path}`}
                onClick={() =>
                  start(async () => {
                    const res = await deleteRedirect(r.id);
                    setNotice(res.ok ? { tone: "ok", text: res.message ?? "Deleted." } : { tone: "error", text: res.error });
                    router.refresh();
                    announcePreviewChange();
                  })
                }
              >
                <IconTrash size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
