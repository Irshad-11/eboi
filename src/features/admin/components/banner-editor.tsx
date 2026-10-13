"use client";

import { useState, useTransition } from "react";
import { announcePreviewChange } from "./preview-panel";
import { useRouter } from "next/navigation";
import { BANNER } from "@/config/limits";
import { MEDIA_FOLDERS } from "@/config/storage";
import { fromDhakaInput, toDhakaInput } from "@/lib/datetime";
import { mediaUrl } from "@/lib/media";
import type { BannerRow } from "@/lib/supabase/database.types";
import { Dialog } from "@/components/ui/dialog";
import { IconEdit, IconPlus } from "@/components/icons";
import { saveBanner, type BannerInput } from "../actions/banners";
import { Field, Toggle } from "./field";
import { ImageUpload } from "./image-upload";
import { Notice } from "./notice";

/** Add/edit a home banner: an image slide, or a text slide with colours. */
export function BannerEditor({ banner }: { banner: BannerRow | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(banner?.id ?? "");
  const blank = (): BannerInput & { start: string; end: string } => ({
    title: banner?.title ?? "",
    subtitle: banner?.subtitle ?? "",
    button_label: banner?.button_label ?? "",
    link_url: banner?.link_url ?? "",
    alt_text: banner?.alt_text ?? "",
    bg_color: banner?.bg_color ?? "#1d5c42",
    text_color: banner?.text_color ?? "#ffffff",
    image_desktop_path: banner?.image_desktop_path ?? null,
    image_mobile_path: banner?.image_mobile_path ?? null,
    overlay_text: banner?.overlay_text ?? false,
    is_active: banner?.is_active ?? true,
    start_at: banner?.start_at ?? null,
    end_at: banner?.end_at ?? null,
    start: toDhakaInput(banner?.start_at),
    end: toDhakaInput(banner?.end_at),
  });
  const [v, setV] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }));
  const hasImage = Boolean(v.image_desktop_path || v.image_mobile_path);

  return (
    <>
      {banner ? (
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Edit banner"
          title="Edit"
          onClick={() => {
            setV(blank());
            setErrors({});
            setError(null);
            setOpen(true);
          }}
        >
          <IconEdit size={16} />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setId(crypto.randomUUID());
            setV(blank());
            setErrors({});
            setError(null);
            setOpen(true);
          }}
        >
          <IconPlus size={18} /> Add banner
        </button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={banner ? "Edit banner" : "Add banner"}
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
                  const { start: s, end: e, ...rest } = v;
                  const res = await saveBanner(id, !banner, { ...rest, start_at: fromDhakaInput(s), end_at: fromDhakaInput(e) });
                  if (!res.ok) {
                    setErrors(res.fieldErrors ?? {});
                    setError(res.error);
                    return;
                  }
                  setOpen(false);
                  router.refresh();
                  announcePreviewChange();
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

          <div>
            <p className="field-label">Preview</p>
            <div className="relative aspect-[16/5] overflow-hidden rounded-md border border-line" style={{ background: v.bg_color, color: v.text_color }}>
              {hasImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                  <img src={mediaUrl(v.image_desktop_path ?? v.image_mobile_path)!} alt="" className="h-full w-full object-cover" />
                  {v.overlay_text && (
                    <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/65 via-black/35 to-transparent px-5">
                      <p className="text-lg font-bold">{v.title || "Title"}</p>
                      {v.subtitle && <p className="mt-1 line-clamp-2 text-sm opacity-90">{v.subtitle}</p>}
                      {v.button_label && <span className="mt-2 inline-flex w-fit rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-brand-ink">{v.button_label}</span>}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col justify-center px-5">
                  <p className="text-lg font-bold">{v.title || "Title"}</p>
                  {v.subtitle && <p className="mt-1 line-clamp-2 text-sm opacity-90">{v.subtitle}</p>}
                  {v.button_label && <span className="mt-2 inline-flex w-fit rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-brand-ink">{v.button_label}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {id && (
              <>
                <ImageUpload
                  id="bn-desktop"
                  label="Desktop image"
                  hint={BANNER.desktop.label}
                  folder={MEDIA_FOLDERS.banners}
                  ownerId={id}
                  value={v.image_desktop_path ?? null}
                  onChange={(p) => set("image_desktop_path", p)}
                  aspect="16 / 5"
                />
                <ImageUpload
                  id="bn-mobile"
                  label="Phone image"
                  hint={BANNER.mobile.label}
                  folder={MEDIA_FOLDERS.banners}
                  ownerId={id}
                  value={v.image_mobile_path ?? null}
                  onChange={(p) => set("image_mobile_path", p)}
                  aspect="3 / 2"
                />
              </>
            )}
            <Field label="Image description (alt text)" htmlFor="bn-alt" error={errors.alt_text} className="sm:col-span-2">
              <input id="bn-alt" className="input" value={v.alt_text} onChange={(e) => set("alt_text", e.target.value)} />
            </Field>
            <Field label="Title" htmlFor="bn-title" hint={hasImage && !v.overlay_text ? "Turn on “Text on the image” to show it" : undefined} error={errors.title}>
              <input id="bn-title" className="input" value={v.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Button label" htmlFor="bn-btn" error={errors.button_label}>
              <input id="bn-btn" className="input" value={v.button_label} onChange={(e) => set("button_label", e.target.value)} />
            </Field>
            <Field label="Subtitle" htmlFor="bn-sub" error={errors.subtitle} className="sm:col-span-2">
              <input id="bn-sub" className="input" value={v.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
            </Field>
            <Field label="Link" htmlFor="bn-link" hint="/shop?deals=1, /books/slug or a full URL" error={errors.link_url} className="sm:col-span-2">
              <input id="bn-link" className="input" value={v.link_url} onChange={(e) => set("link_url", e.target.value)} />
            </Field>
            <Field label="Background colour" htmlFor="bn-bg" error={errors.bg_color}>
              <div className="flex gap-2">
                <input type="color" aria-label="Pick background colour" className="h-11 w-12 shrink-0 cursor-pointer rounded-md border border-line-2 bg-white p-1" value={v.bg_color} onChange={(e) => set("bg_color", e.target.value)} />
                <input id="bn-bg" className="input" value={v.bg_color} onChange={(e) => set("bg_color", e.target.value)} />
              </div>
            </Field>
            <Field label="Text colour" htmlFor="bn-fg" error={errors.text_color}>
              <div className="flex gap-2">
                <input type="color" aria-label="Pick text colour" className="h-11 w-12 shrink-0 cursor-pointer rounded-md border border-line-2 bg-white p-1" value={v.text_color} onChange={(e) => set("text_color", e.target.value)} />
                <input id="bn-fg" className="input" value={v.text_color} onChange={(e) => set("text_color", e.target.value)} />
              </div>
            </Field>
            <Field label="Show from (Dhaka time)" htmlFor="bn-start" hint="Optional">
              <input id="bn-start" type="datetime-local" className="input" value={v.start} onChange={(e) => set("start", e.target.value)} />
            </Field>
            <Field label="Show until" htmlFor="bn-end" hint="Optional" error={errors.end_at}>
              <input id="bn-end" type="datetime-local" className="input" value={v.end} onChange={(e) => set("end", e.target.value)} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <Toggle id="bn-active" label="Active" checked={Boolean(v.is_active)} onChange={(c) => set("is_active", c)} />
            {hasImage && (
              <Toggle
                id="bn-overlay"
                label="Text on the image"
                hint="Shows the title, subtitle and button over the photo"
                checked={Boolean(v.overlay_text)}
                onChange={(c) => set("overlay_text", c)}
              />
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
