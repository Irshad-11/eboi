"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MEDIA_FOLDERS } from "@/config/storage";
import { mediaUrl } from "@/lib/media";
import { FEATURES, POPUP_FREQUENCIES, type FeatureKey, type SiteSettings } from "@/features/settings/schema";
import { saveStorefront } from "../actions/settings";
import { SITE_MEDIA_OWNER } from "../media-owners";
import { AdminCard } from "./admin-page-head";
import { Field, Toggle } from "./field";
import { ImageUpload } from "./image-upload";
import { Notice } from "./notice";
import { announcePreviewChange } from "./preview-panel";

type Props = { settings: SiteSettings };

/** Announcement bar, pop-up, slider speed, feature switches and popular searches. */
export function StorefrontForm({ settings }: Props) {
  const router = useRouter();
  const [v, setV] = useState({
    announcement: settings.announcement,
    announcement_link: settings.announcement_link,
    announcement_active: settings.announcement_active,
    announcement_dismissible: settings.announcement_dismissible,
    announcement_bg: settings.announcement_bg,
    announcement_fg: settings.announcement_fg,
    announcement_image: settings.announcement_image,
    hero_interval: settings.hero_interval,
    popup_enabled: settings.popup_enabled,
    popup_title: settings.popup_title,
    popup_body: settings.popup_body,
    popup_image: settings.popup_image,
    popup_button_label: settings.popup_button_label,
    popup_link: settings.popup_link,
    popup_show_latest: settings.popup_show_latest,
    popup_delay: settings.popup_delay,
    popup_autoclose: settings.popup_autoclose,
    popup_frequency: settings.popup_frequency,
    features: settings.features,
    trending: settings.trending_searches.join(", "),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }));
  const err = (k: string) => errors[k];

  const color = (key: "announcement_bg" | "announcement_fg", label: string) => (
    <Field label={label} htmlFor={`sf-${key}`} error={err(key)}>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`Pick ${label.toLowerCase()}`}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-md border border-line-2 bg-white p-1"
          value={v[key]}
          onChange={(e) => set(key, e.target.value)}
        />
        <input id={`sf-${key}`} className="input" value={v[key]} onChange={(e) => set(key, e.target.value)} />
      </div>
    </Field>
  );

  const annImage = mediaUrl(v.announcement_image);

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const { trending, ...rest } = v;
          const res = await saveStorefront({
            ...rest,
            trending_searches: trending
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .slice(0, 10),
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

      <AdminCard title="Announcement bar" description="The thin notice at the very top of every page. Red by default.">
        <div className="mb-4 overflow-hidden rounded-md border border-line">
          <div className="flex min-h-9 items-center justify-center gap-2 px-10 py-1.5 text-center text-sm" style={{ background: v.announcement_bg, color: v.announcement_fg }}>
            {annImage && (
              // eslint-disable-next-line @next/next/no-img-element -- live preview of the admin's image or GIF
              <img src={annImage} alt="" className={v.announcement ? "h-6 w-auto" : "max-h-14 w-auto"} />
            )}
            <span className="font-medium">{v.announcement || (annImage ? "" : "Your announcement text")}</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Text" htmlFor="sf-ann" error={err("announcement")} className="sm:col-span-2">
            <input id="sf-ann" className="input" maxLength={160} value={v.announcement} onChange={(e) => set("announcement", e.target.value)} />
          </Field>
          <Field label="Link (optional)" htmlFor="sf-ann-link" hint="/shop?deals=1 or https://…" error={err("announcement_link")}>
            <input id="sf-ann-link" className="input" value={v.announcement_link} onChange={(e) => set("announcement_link", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            {color("announcement_bg", "Background")}
            {color("announcement_fg", "Text colour")}
          </div>
          <ImageUpload
            id="sf-ann-img"
            label="Image or GIF (optional)"
            hint="Shown beside the text. With no text, it fills the bar."
            folder={MEDIA_FOLDERS.promo}
            ownerId={SITE_MEDIA_OWNER}
            value={v.announcement_image}
            onChange={(p) => set("announcement_image", p)}
            aspect="4 / 1"
          />
          <div className="space-y-2">
            <Toggle id="sf-ann-on" label="Show the bar" checked={v.announcement_active} onChange={(c) => set("announcement_active", c)} />
            <Toggle id="sf-ann-x" label="Visitors can close it" checked={v.announcement_dismissible} onChange={(c) => set("announcement_dismissible", c)} />
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Pop-up" description="Shown once after a visitor arrives: an offer, news or your latest books. It can close itself after a few seconds.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Toggle id="sf-pop-on" label="Show the pop-up" checked={v.popup_enabled} onChange={(c) => set("popup_enabled", c)} />
          </div>
          <Field label="Title" htmlFor="sf-pop-title" error={err("popup_title")}>
            <input id="sf-pop-title" className="input" maxLength={80} value={v.popup_title} onChange={(e) => set("popup_title", e.target.value)} />
          </Field>
          <Field label="Button label" htmlFor="sf-pop-btn" hint="Leave empty for no button" error={err("popup_button_label")}>
            <input id="sf-pop-btn" className="input" maxLength={40} value={v.popup_button_label} onChange={(e) => set("popup_button_label", e.target.value)} />
          </Field>
          <Field label="Text" htmlFor="sf-pop-body" error={err("popup_body")} className="sm:col-span-2">
            <textarea id="sf-pop-body" rows={2} maxLength={300} className="textarea min-h-16" value={v.popup_body} onChange={(e) => set("popup_body", e.target.value)} />
          </Field>
          <Field label="Button link" htmlFor="sf-pop-link" hint="/collections/weekend-reads or https://…" error={err("popup_link")}>
            <input id="sf-pop-link" className="input" value={v.popup_link} onChange={(e) => set("popup_link", e.target.value)} />
          </Field>
          <ImageUpload
            id="sf-pop-img"
            label="Image or GIF (optional)"
            hint="Wide images work best, e.g. 800 × 400"
            folder={MEDIA_FOLDERS.promo}
            ownerId={SITE_MEDIA_OWNER}
            value={v.popup_image}
            onChange={(p) => set("popup_image", p)}
            aspect="2 / 1"
          />
          <Field label="Show after (seconds)" htmlFor="sf-pop-delay" error={err("popup_delay")}>
            <input id="sf-pop-delay" type="number" min={0} max={60} className="input" value={v.popup_delay} onChange={(e) => set("popup_delay", Number(e.target.value))} />
          </Field>
          <Field label="Close by itself after (seconds)" htmlFor="sf-pop-auto" hint="0 = stays until closed" error={err("popup_autoclose")}>
            <input id="sf-pop-auto" type="number" min={0} max={120} className="input" value={v.popup_autoclose} onChange={(e) => set("popup_autoclose", Number(e.target.value))} />
          </Field>
          <Field label="How often" htmlFor="sf-pop-freq">
            <select id="sf-pop-freq" className="select" value={v.popup_frequency} onChange={(e) => set("popup_frequency", e.target.value as typeof v.popup_frequency)}>
              {Object.entries(POPUP_FREQUENCIES).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <Toggle id="sf-pop-latest" label="Show the 3 newest books" checked={v.popup_show_latest} onChange={(c) => set("popup_show_latest", c)} />
          </div>
        </div>
        <p className="mt-3 text-sm text-text-3">Saving a changed pop-up shows it again, even to visitors who closed the old one.</p>
      </AdminCard>

      <AdminCard title="Banner slider">
        <Field label="Seconds per slide" htmlFor="sf-hero" hint="0 = the slider does not move by itself" error={err("hero_interval")} className="max-w-xs">
          <input id="sf-hero" type="number" min={0} max={30} className="input" value={v.hero_interval} onChange={(e) => set("hero_interval", Number(e.target.value))} />
        </Field>
      </AdminCard>

      <AdminCard title="Store features" description="Switch any of these on or off. Numbers shown to visitors are always real.">
        <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {(Object.keys(FEATURES) as FeatureKey[]).map((k) => (
            <li key={k}>
              <Toggle
                id={`sf-f-${k}`}
                label={FEATURES[k].label}
                hint={FEATURES[k].hint}
                checked={v.features[k]}
                onChange={(c) => set("features", { ...v.features, [k]: c })}
              />
            </li>
          ))}
        </ul>
        <Field label="Popular searches" htmlFor="sf-trend" hint="Comma separated, up to 10. Shown when the search box is empty." className="mt-5">
          <input id="sf-trend" className="input" value={v.trending} onChange={(e) => set("trending", e.target.value)} placeholder="ielts, freelancing, bangla novel" />
        </Field>
      </AdminCard>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <button className="btn btn-primary" data-loading={pending} disabled={pending}>
          Save
        </button>
      </div>
    </form>
  );
}
