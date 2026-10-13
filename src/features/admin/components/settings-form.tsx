"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publicEnv } from "@/lib/env";
import type { PaymentMethod, SiteSettings, Step } from "@/features/settings/schema";
import { TEMPLATE_TOKENS } from "@/features/settings/schema";
import { buildListMessage, buildSingleMessage, type MessageBook } from "@/features/whatsapp/message";
import { saveGeneralSettings } from "../actions/settings";
import { AdminCard } from "./admin-page-head";
import { Field, Toggle } from "./field";
import { ListEditor } from "./list-editor";
import { Notice } from "./notice";

const SAMPLE: MessageBook = {
  title: "Sample Book Title",
  book_code: "EB-0001",
  slug: "sample-book-title",
  pricing: { base: 250, final: 200, was: 250, offer: { id: "x", title: "Sample offer", banner_text: "", end_at: null, show_countdown: false, discount_type: "percent", value: 20 }, savePercent: 20 },
};

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const text = (k: keyof SiteSettings, id: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input id={id} className="input" value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} aria-invalid={Boolean(errors[k]) || undefined} {...extra} />
  );

  return (
    <form
      className="space-y-4 pb-20"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveGeneralSettings({
            site_name: s.site_name,
            tagline: s.tagline,
            currency_symbol: s.currency_symbol,
            whatsapp_number: s.whatsapp_number,
            whatsapp_template: s.whatsapp_template,
            whatsapp_list_template: s.whatsapp_list_template,
            response_time: s.response_time,
            delivery_note: s.delivery_note,
            announcement: s.announcement,
            announcement_link: s.announcement_link,
            announcement_active: s.announcement_active,
            announcement_dismissible: s.announcement_dismissible,
            payment_methods: s.payment_methods,
            how_to_buy_steps: s.how_to_buy_steps,
          });
          setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
          setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
          if (res.ok) router.refresh();
        });
      }}
    >
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <AdminCard title="Store">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Store name" htmlFor="st-name" error={errors.site_name}>
            {text("site_name", "st-name")}
          </Field>
          <Field label="Tagline" htmlFor="st-tagline" hint="Footer and default page title" error={errors.tagline}>
            {text("tagline", "st-tagline")}
          </Field>
          <Field label="Currency symbol" htmlFor="st-currency" error={errors.currency_symbol}>
            {text("currency_symbol", "st-currency")}
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Announcement bar">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Text" htmlFor="st-ann" error={errors.announcement} className="sm:col-span-2">
            {text("announcement", "st-ann", { maxLength: 160 })}
          </Field>
          <Field label="Link (optional)" htmlFor="st-ann-link" hint="/shop?deals=1 or https://…" error={errors.announcement_link}>
            {text("announcement_link", "st-ann-link")}
          </Field>
          <div className="space-y-1">
            <Toggle id="st-ann-on" label="Show the bar" checked={s.announcement_active} onChange={(c) => set("announcement_active", c)} />
            <Toggle id="st-ann-x" label="Visitors can close it" checked={s.announcement_dismissible} onChange={(c) => set("announcement_dismissible", c)} />
          </div>
        </div>
      </AdminCard>

      <AdminCard title="WhatsApp ordering" description={`Placeholders: ${TEMPLATE_TOKENS.title} ${TEMPLATE_TOKENS.id} ${TEMPLATE_TOKENS.price} ${TEMPLATE_TOKENS.url}; for My List: ${TEMPLATE_TOKENS.list} ${TEMPLATE_TOKENS.total} ${TEMPLATE_TOKENS.url}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp number" htmlFor="st-wa" hint="With country code, e.g. 8801712345678" error={errors.whatsapp_number}>
            {text("whatsapp_number", "st-wa", { inputMode: "tel" })}
          </Field>
          <Field label="Reply time" htmlFor="st-resp" hint="Used as [Response time], e.g. 10 minutes" error={errors.response_time}>
            {text("response_time", "st-resp")}
          </Field>
          <Field label="Delivery line" htmlFor="st-deliv" hint="Shown on every book page" error={errors.delivery_note} className="sm:col-span-2">
            {text("delivery_note", "st-deliv")}
          </Field>
          <Field label="Message for one book" htmlFor="st-tpl" error={errors.whatsapp_template}>
            <textarea id="st-tpl" rows={7} className="textarea" value={s.whatsapp_template} onChange={(e) => set("whatsapp_template", e.target.value)} />
          </Field>
          <Preview text={buildSingleMessage(s.whatsapp_template, SAMPLE, s.currency_symbol, publicEnv.siteUrl)} />
          <Field label="Message for My List" htmlFor="st-tpl-list" error={errors.whatsapp_list_template}>
            <textarea id="st-tpl-list" rows={7} className="textarea" value={s.whatsapp_list_template} onChange={(e) => set("whatsapp_list_template", e.target.value)} />
          </Field>
          <Preview
            text={buildListMessage(
              s.whatsapp_list_template,
              [SAMPLE, { ...SAMPLE, title: "Second Sample", book_code: "EB-0002", pricing: { ...SAMPLE.pricing, final: 300, was: null, offer: null } }],
              s.currency_symbol,
              publicEnv.siteUrl,
            )}
          />
        </div>
      </AdminCard>

      <AdminCard title="Order steps" description="Shown on the home page, the How to order page and in the order dialog. [Response time] is replaced by the reply time.">
        <ListEditor<Step>
          items={s.how_to_buy_steps}
          onChange={(v) => set("how_to_buy_steps", v)}
          blank={() => ({ title: "", body: "" })}
          addLabel="Add step"
          max={8}
          render={(st, upd, i) => (
            <div className="grid gap-2 sm:grid-cols-[2rem_minmax(0,1fr)]">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <div className="space-y-2">
                <input aria-label={`Step ${i + 1} title`} className="input" value={st.title} onChange={(e) => upd({ title: e.target.value })} />
                <input aria-label={`Step ${i + 1} text`} className="input" value={st.body} onChange={(e) => upd({ body: e.target.value })} />
              </div>
            </div>
          )}
        />
        {errors.how_to_buy_steps && <p className="field-error">{errors.how_to_buy_steps}</p>}
      </AdminCard>

      <AdminCard title="Payment methods" description="Numbers are shown on the How to order page with a copy button. Labels show in the footer.">
        <ListEditor<PaymentMethod>
          items={s.payment_methods}
          onChange={(v) => set("payment_methods", v)}
          blank={() => ({ label: "", number: "", note: "" })}
          addLabel="Add payment method"
          max={6}
          render={(m, upd, i) => (
            <div className="grid gap-2 sm:grid-cols-3">
              <input aria-label={`Method ${i + 1} name`} placeholder="bKash" className="input" value={m.label} onChange={(e) => upd({ label: e.target.value })} />
              <input aria-label={`Method ${i + 1} number`} placeholder="01XXXXXXXXX" inputMode="tel" className="input" value={m.number} onChange={(e) => upd({ number: e.target.value })} />
              <input aria-label={`Method ${i + 1} note`} placeholder="Send Money" className="input" value={m.note} onChange={(e) => upd({ note: e.target.value })} />
            </div>
          )}
        />
        {errors.payment_methods && <p className="field-error">{errors.payment_methods}</p>}
      </AdminCard>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 py-3 lg:left-[15.5rem]">
        <div className="mx-auto flex max-w-6xl justify-end">
          <button className="btn btn-primary" data-loading={pending} disabled={pending}>
            Save settings
          </button>
        </div>
      </div>
    </form>
  );
}

function Preview({ text }: { text: string }) {
  return (
    <div>
      <p className="field-label">Preview</p>
      <pre className="rounded-md bg-muted p-3 font-sans text-sm whitespace-pre-wrap text-text-2">{text}</pre>
    </div>
  );
}
