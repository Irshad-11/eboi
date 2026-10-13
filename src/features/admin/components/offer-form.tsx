"use client";

import { useState, useTransition } from "react";
import { announcePreviewChange } from "./preview-panel";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { fromDhakaInput, toDhakaInput } from "@/lib/datetime";
import type { OfferRow, OfferScope, DiscountType } from "@/lib/supabase/database.types";
import { applyDiscount } from "@/features/offers/pricing";
import { saveOffer } from "../actions/offers";
import { Field, FieldGroup, Toggle } from "./field";
import { Notice } from "./notice";

type Props = {
  offer: (OfferRow & { bookIds: string[]; collectionIds: string[] }) | null;
  books: { id: string; title: string; book_code: string; price: number }[];
  collections: { id: string; name: string }[];
};

export function OfferForm({ offer, books, collections }: Props) {
  const router = useRouter();
  const [type, setType] = useState<DiscountType>(offer?.discount_type ?? "percent");
  const [value, setValue] = useState(String(offer?.value ?? "15"));
  const [scope, setScope] = useState<OfferScope>(offer?.applies_to ?? "all");
  const [bookIds, setBookIds] = useState<string[]>(offer?.bookIds ?? []);
  const [filter, setFilter] = useState("");
  const [countdown, setCountdown] = useState(offer?.show_countdown ?? false);
  const [active, setActive] = useState(offer?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const o = offer;

  const sample = 250;
  const sampleAfter = applyDiscount(sample, type, Number(value) || 0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await saveOffer(o?.id ?? null, {
        title: String(fd.get("title") ?? ""),
        banner_text: String(fd.get("banner_text") ?? ""),
        discount_type: type,
        value,
        applies_to: scope,
        start_at: fromDhakaInput(String(fd.get("start_at") ?? "")) ?? new Date().toISOString(),
        end_at: fromDhakaInput(String(fd.get("end_at") ?? "")),
        show_countdown: countdown,
        is_active: active,
        bookIds,
        collectionIds: fd.getAll("collectionIds").map(String),
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setNotice({ tone: "error", text: res.error });
        return;
      }
      setErrors({});
      setNotice({ tone: "ok", text: res.message ?? "Saved." });
      if (!o) router.replace(`/admin/offers/${res.data.id}`);
      else router.refresh();
      announcePreviewChange();
    });
  }

  const visible = books.filter((b) => !filter || `${b.title} ${b.book_code}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <FieldGroup title="Offer" description="Live offers show on the home page and next to every price they change.">
        <Field label="Title" htmlFor="o-title" error={errors.title} className="sm:col-span-2">
          <input id="o-title" name="title" className="input" defaultValue={o?.title ?? ""} placeholder="Monsoon week" />
        </Field>
        <Field label="Banner text" htmlFor="o-banner" error={errors.banner_text} hint="One sentence. Up to 160 characters." className="sm:col-span-2">
          <input id="o-banner" name="banner_text" maxLength={160} className="input" defaultValue={o?.banner_text ?? ""} />
        </Field>
        <fieldset>
          <legend className="field-label">Discount</legend>
          <div className="flex gap-2">
            <select aria-label="Discount type" value={type} onChange={(e) => setType(e.target.value as DiscountType)} className="select w-40">
              <option value="percent">Percent</option>
              <option value="fixed">Fixed taka</option>
            </select>
            <input aria-label="Discount value" type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} className="input tnum" />
          </div>
          {errors.value && <p className="field-error">{errors.value}</p>}
        </fieldset>
        <div className="self-end rounded-md bg-sale-soft px-3 py-2.5 text-sm text-text-2">
          A {formatPrice(sample)} book becomes <span className="font-semibold text-sale">{formatPrice(sampleAfter)}</span>
        </div>
      </FieldGroup>

      <FieldGroup title="Applies to" description="If several offers touch one book, the one with the lowest price wins. They never stack.">
        <fieldset className="sm:col-span-2">
          <legend className="sr-only">Applies to</legend>
          <div className="flex flex-wrap gap-6">
            {(
              [
                ["all", "Every book"],
                ["books", "Specific books"],
                ["collections", "Collections"],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className="flex min-h-11 items-center gap-2 text-base">
                <input type="radio" name="applies_to" value={v} checked={scope === v} onChange={() => setScope(v)} className="check" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {scope === "books" && (
          <div className="sm:col-span-2">
            <label htmlFor="o-filter" className="field-label">
              Books ({bookIds.length} picked)
            </label>
            <input id="o-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by title or ID" className="input mb-2" />
            <div className="max-h-72 overflow-auto rounded-md border border-line p-1">
              {visible.map((b) => (
                <label key={b.id} className="flex min-h-10 items-center gap-3 rounded-md px-2 hover:bg-muted">
                  <input
                    type="checkbox"
                    className="check"
                    checked={bookIds.includes(b.id)}
                    onChange={(e) => setBookIds((l) => (e.target.checked ? [...l, b.id] : l.filter((x) => x !== b.id)))}
                  />
                  <span className="w-20 text-sm text-text-3">{b.book_code}</span>
                  <span className="min-w-0 flex-1 truncate text-base">{b.title}</span>
                  <span className="text-sm font-semibold tnum">{formatPrice(b.price)}</span>
                </label>
              ))}
            </div>
            {errors.bookIds && <p className="field-error">{errors.bookIds}</p>}
          </div>
        )}

        {scope === "collections" && (
          <fieldset className="sm:col-span-2">
            <legend className="field-label">Collections</legend>
            {collections.map((c) => (
              <label key={c.id} className="flex min-h-10 items-center gap-2 text-base">
                <input type="checkbox" name="collectionIds" value={c.id} defaultChecked={o?.collectionIds.includes(c.id)} className="check" />
                {c.name}
              </label>
            ))}
            {errors.collectionIds && <p className="field-error">{errors.collectionIds}</p>}
          </fieldset>
        )}
      </FieldGroup>

      <FieldGroup title="Schedule" description="Dhaka time. The site picks up the start and end within about 10 minutes.">
        <Field label="Starts" htmlFor="o-start" error={errors.start_at}>
          <input id="o-start" name="start_at" type="datetime-local" className="input tnum" defaultValue={toDhakaInput(o?.start_at ?? new Date().toISOString())} />
        </Field>
        <Field label="Ends (optional)" htmlFor="o-end" error={errors.end_at}>
          <input id="o-end" name="end_at" type="datetime-local" className="input tnum" defaultValue={toDhakaInput(o?.end_at)} />
        </Field>
        <Toggle id="o-countdown" label="Show a countdown" checked={countdown} onChange={setCountdown} />
        <Toggle id="o-active" label="Active" checked={active} onChange={setActive} />
        {errors.show_countdown && <p className="field-error sm:col-span-2">{errors.show_countdown}</p>}
      </FieldGroup>

      <button className="btn btn-primary" data-loading={pending} disabled={pending}>
        {o ? "Save offer" : "Create offer"}
      </button>
    </form>
  );
}
