"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { IconPlus, IconClose } from "@/components/icons";
import type { SiteSettings, SocialLink } from "@/features/settings/schema";
import { TEMPLATE_TOKENS } from "@/features/settings/schema";
import { buildListMessage, buildSingleMessage, type MessageBook } from "@/features/whatsapp/message";
import { saveGeneralSettings } from "../actions/settings";
import { Field, FieldGroup } from "./field";
import { Notice } from "./notice";

/** A made-up sample used only to preview templates in this form. */
const SAMPLE: MessageBook = {
  title: "Sample Book Title",
  book_code: "EB-0001",
  slug: "sample-book-title",
  pricing: { base: 250, final: 200, was: 250, offer: { id: "x", title: "Sample offer", banner_text: "", end_at: null, show_countdown: false }, savePercent: 20 },
};

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      className="space-y-10"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveGeneralSettings({
            site_name: s.site_name,
            tagline: s.tagline,
            whatsapp_number: s.whatsapp_number,
            whatsapp_template: s.whatsapp_template,
            whatsapp_list_template: s.whatsapp_list_template,
            currency_symbol: s.currency_symbol,
            announcement: s.announcement,
            announcement_active: s.announcement_active,
            delivery_note: s.delivery_note,
            social_links: s.social_links.filter((l) => l.label || l.url),
          });
          setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
          setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
          if (res.ok) router.refresh();
        });
      }}
    >
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <FieldGroup title="Shop">
        <Field label="Site name" htmlFor="site_name" error={errors.site_name}>
          <input id="site_name" className="input" value={s.site_name} onChange={(e) => set("site_name", e.target.value)} />
        </Field>
        <Field label="Tagline" htmlFor="tagline" error={errors.tagline}>
          <input id="tagline" className="input" value={s.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </Field>
        <Field label="Currency symbol" htmlFor="currency_symbol" error={errors.currency_symbol}>
          <input id="currency_symbol" className="input input-mono" value={s.currency_symbol} onChange={(e) => set("currency_symbol", e.target.value)} />
        </Field>
        <Field label="Delivery note" htmlFor="delivery_note" hint="Real promise shown under every buy button." error={errors.delivery_note} className="sm:col-span-2">
          <textarea id="delivery_note" rows={2} className="textarea min-h-0" value={s.delivery_note} onChange={(e) => set("delivery_note", e.target.value)} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Announcement" description="A thin bar above the header on every page.">
        <Field label="Text" htmlFor="announcement" error={errors.announcement} className="sm:col-span-2">
          <input id="announcement" maxLength={160} className="input" value={s.announcement} onChange={(e) => set("announcement", e.target.value)} />
        </Field>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" className="check" checked={s.announcement_active} onChange={(e) => set("announcement_active", e.target.checked)} />
          Show the announcement
        </label>
      </FieldGroup>

      <FieldGroup
        title="WhatsApp"
        description={`Placeholders: ${TEMPLATE_TOKENS.title} ${TEMPLATE_TOKENS.id} ${TEMPLATE_TOKENS.price} ${TEMPLATE_TOKENS.url}. List message: ${TEMPLATE_TOKENS.list} ${TEMPLATE_TOKENS.total} ${TEMPLATE_TOKENS.url}.`}
      >
        <Field label="WhatsApp number" htmlFor="whatsapp_number" hint="Digits with country code, e.g. 8801712345678" error={errors.whatsapp_number} className="sm:col-span-2">
          <input id="whatsapp_number" inputMode="tel" className="input input-mono" value={s.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} />
        </Field>
        <Field label="Message for one book" htmlFor="whatsapp_template" error={errors.whatsapp_template}>
          <textarea id="whatsapp_template" rows={7} className="textarea font-mono text-[0.9rem]" value={s.whatsapp_template} onChange={(e) => set("whatsapp_template", e.target.value)} />
        </Field>
        <Preview text={buildSingleMessage(s.whatsapp_template, SAMPLE, s.currency_symbol, publicEnv.siteUrl)} />
        <Field label="Message for My List" htmlFor="whatsapp_list_template" error={errors.whatsapp_list_template}>
          <textarea id="whatsapp_list_template" rows={7} className="textarea font-mono text-[0.9rem]" value={s.whatsapp_list_template} onChange={(e) => set("whatsapp_list_template", e.target.value)} />
        </Field>
        <Preview text={buildListMessage(s.whatsapp_list_template, [SAMPLE, { ...SAMPLE, title: "Second Sample", book_code: "EB-0002", pricing: { ...SAMPLE.pricing, final: 300, was: null, offer: null } }], s.currency_symbol, publicEnv.siteUrl)} />
      </FieldGroup>

      <FieldGroup title="Social links" description="Shown in the footer and in the Organization data for Google.">
        <div className="space-y-3 sm:col-span-2">
          {s.social_links.map((l, i) => (
            <div key={i} className="grid grid-cols-[8rem_minmax(0,1fr)_auto] gap-2">
              <input aria-label="Label" placeholder="Facebook" className="input" value={l.label} onChange={(e) => set("social_links", s.social_links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input aria-label="URL" placeholder="https://" className="input input-mono" value={l.url} onChange={(e) => set("social_links", s.social_links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <button type="button" aria-label="Remove link" className="inline-flex size-12 items-center justify-center hover:bg-paper-2" onClick={() => set("social_links", s.social_links.filter((_, j) => j !== i))}>
                <IconClose size={18} />
              </button>
            </div>
          ))}
          {errors.social_links && <p className="field-error">{errors.social_links}</p>}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => set("social_links", [...s.social_links, { label: "", url: "" } as SocialLink])}>
            <IconPlus size={16} /> Add link
          </button>
        </div>
      </FieldGroup>

      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function Preview({ text }: { text: string }) {
  return (
    <div>
      <p className="field-label">Preview</p>
      <pre className="border-l-4 border-green-900 bg-paper-raised p-3 font-mono text-[0.85rem] whitespace-pre-wrap">{text}</pre>
    </div>
  );
}
