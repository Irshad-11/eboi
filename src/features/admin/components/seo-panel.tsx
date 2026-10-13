"use client";

import { cn } from "@/lib/cn";
import { slugify } from "@/lib/slug";
import { publicEnv } from "@/lib/env";
import { IconCheck, IconClose } from "@/components/icons";
import type { MediaFolder } from "@/config/storage";
import { Field, Toggle } from "./field";
import { ImageUpload } from "./image-upload";

export type SeoValue = {
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  seo_keywords: string;
  canonical_url: string;
  noindex: boolean;
  og_image_path: string | null;
};

export const EMPTY_SEO: SeoValue = {
  seo_title: "",
  seo_description: "",
  focus_keyword: "",
  seo_keywords: "",
  canonical_url: "",
  noindex: false,
  og_image_path: null,
};

type Props = {
  idPrefix: string;
  value: SeoValue;
  onChange: (v: SeoValue) => void;
  /** What the page shows when the SEO fields are empty. */
  autoTitle: string;
  autoDescription: string;
  path: string;
  slug?: string;
  firstParagraph?: string;
  coverAlt?: string;
  titleTemplate: string;
  applyTemplate?: boolean;
  og: { folder: MediaFolder; ownerId: string };
  errors?: Record<string, string>;
};

const TITLE = { min: 30, max: 60 };
const DESC = { min: 110, max: 160 };

function lengthTone(n: number, r: { min: number; max: number }) {
  if (n === 0) return "text-text-3";
  if (n < r.min) return "text-warn";
  if (n > r.max) return "text-sale";
  return "text-brand";
}

/** SEO fields with a search-result preview and a focus-keyword checklist. */
export function SeoPanel(p: Props) {
  const v = p.value;
  const set = <K extends keyof SeoValue>(k: K, val: SeoValue[K]) => p.onChange({ ...v, [k]: val });
  const baseTitle = v.seo_title.trim() || p.autoTitle;
  const fullTitle = p.applyTemplate === false ? baseTitle : p.titleTemplate.includes("%s") ? p.titleTemplate.replace("%s", baseTitle) : baseTitle;
  const desc = v.seo_description.trim() || p.autoDescription;
  const host = publicEnv.siteUrl.replace(/^https?:\/\//, "");
  const kw = v.focus_keyword.trim().toLowerCase();

  const checks: [string, boolean][] = kw
    ? [
        ["In the SEO title", fullTitle.toLowerCase().includes(kw)],
        ["In the meta description", desc.toLowerCase().includes(kw)],
        ...(p.slug !== undefined ? ([["In the URL slug", p.slug.includes(slugify(kw, "~"))]] as [string, boolean][]) : []),
        ...(p.firstParagraph !== undefined ? ([["In the first paragraph", p.firstParagraph.toLowerCase().includes(kw)]] as [string, boolean][]) : []),
        ...(p.coverAlt !== undefined ? ([["In the cover alt text", p.coverAlt.toLowerCase().includes(kw)]] as [string, boolean][]) : []),
      ]
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <Field label="SEO title" htmlFor={`${p.idPrefix}-title`} error={p.errors?.seo_title} hint={<span className={lengthTone(baseTitle.length, TITLE)}>{baseTitle.length} characters (best {TITLE.min}–{TITLE.max})</span>}>
          <input id={`${p.idPrefix}-title`} className="input" maxLength={70} value={v.seo_title} placeholder={p.autoTitle} onChange={(e) => set("seo_title", e.target.value)} />
        </Field>
        <Field label="Meta description" htmlFor={`${p.idPrefix}-desc`} error={p.errors?.seo_description} hint={<span className={lengthTone(desc.length, DESC)}>{desc.length} characters (best {DESC.min}–{DESC.max})</span>}>
          <textarea id={`${p.idPrefix}-desc`} className="textarea min-h-20" maxLength={200} value={v.seo_description} placeholder={p.autoDescription} onChange={(e) => set("seo_description", e.target.value)} />
        </Field>
        <Field label="Focus keyword" htmlFor={`${p.idPrefix}-kw`} error={p.errors?.focus_keyword}>
          <input id={`${p.idPrefix}-kw`} className="input" maxLength={60} value={v.focus_keyword} onChange={(e) => set("focus_keyword", e.target.value)} />
        </Field>
        <Field label="More keywords" htmlFor={`${p.idPrefix}-kws`} hint="Comma separated" error={p.errors?.seo_keywords}>
          <input id={`${p.idPrefix}-kws`} className="input" value={v.seo_keywords} onChange={(e) => set("seo_keywords", e.target.value)} />
        </Field>
        <Field label="Canonical URL" htmlFor={`${p.idPrefix}-canon`} hint="Leave empty to use this page's own address" error={p.errors?.canonical_url}>
          <input id={`${p.idPrefix}-canon`} className="input" value={v.canonical_url} placeholder={`${publicEnv.siteUrl}${p.path}`} onChange={(e) => set("canonical_url", e.target.value)} />
        </Field>
        <Toggle id={`${p.idPrefix}-noindex`} label="Hide from search engines (noindex)" checked={v.noindex} onChange={(c) => set("noindex", c)} />
        <ImageUpload
          id={`${p.idPrefix}-og`}
          label="Share image"
          hint="1200 × 630. Leave empty to use the automatic image."
          folder={p.og.folder}
          ownerId={p.og.ownerId}
          value={v.og_image_path}
          onChange={(path) => set("og_image_path", path)}
          aspect="1200 / 630"
        />
      </div>

      <div className="space-y-4">
        <div>
          <p className="field-label">Search result preview</p>
          <div className="rounded-md border border-line bg-white p-4">
            <p className="truncate text-sm text-text-3">
              {host}
              {p.path !== "/" && <span> › {p.path.replace(/^\//, "").split("/").join(" › ")}</span>}
            </p>
            <p className="mt-0.5 line-clamp-1 text-lg text-brand">{fullTitle}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-text-2">{desc}</p>
          </div>
        </div>
        <div>
          <p className="field-label">Focus keyword checklist</p>
          {checks.length ? (
            <ul className="space-y-1.5 rounded-md border border-line bg-white p-3">
              {checks.map(([label, ok]) => (
                <li key={label} className="flex items-center gap-2 text-sm">
                  <span className={cn("inline-flex size-5 items-center justify-center rounded-full text-white", ok ? "bg-brand" : "bg-sale")}>
                    {ok ? <IconCheck size={12} /> : <IconClose size={12} />}
                  </span>
                  {label}
                  <span className="sr-only">{ok ? "pass" : "fail"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-dashed border-line-2 p-3 text-sm text-text-3">Add a focus keyword to see the checklist.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Converts the panel state to the shape stored in the database. */
export function seoToRow(v: SeoValue) {
  return {
    seo_title: v.seo_title.trim() || null,
    seo_description: v.seo_description.trim() || null,
    focus_keyword: v.focus_keyword.trim() || null,
    seo_keywords: v.seo_keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    canonical_url: v.canonical_url.trim() || null,
    noindex: v.noindex,
    og_image_path: v.og_image_path,
  };
}

export function seoFromRow(r: Partial<Record<keyof SeoValue, unknown>> | null | undefined): SeoValue {
  if (!r) return EMPTY_SEO;
  return {
    seo_title: (r.seo_title as string) ?? "",
    seo_description: (r.seo_description as string) ?? "",
    focus_keyword: (r.focus_keyword as string) ?? "",
    seo_keywords: Array.isArray(r.seo_keywords) ? (r.seo_keywords as string[]).join(", ") : "",
    canonical_url: (r.canonical_url as string) ?? "",
    noindex: Boolean(r.noindex),
    og_image_path: (r.og_image_path as string) ?? null,
  };
}
