"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { fromDhakaInput, toDhakaInput } from "@/lib/datetime";
import type { OfferRow, OfferScope, DiscountType } from "@/lib/supabase/database.types";
import { applyDiscount } from "@/features/offers/pricing";
import { saveOffer } from "../actions/offers";
import { Field, FieldGroup } from "./field";
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
        show_countdown: fd.get("show_countdown") === "on",
        is_active: fd.get("is_active") === "on",
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
    });
  }

  const visible = books.filter((b) => !filter || `${b.title} ${b.book_code}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <form onSubmit={onSubmit} className="space-y-10" noValidate>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <FieldGroup title="The offer" description="Shown on the home page (up to 4 live offers) and next to every price it changes.">
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
            <input aria-label="Discount value" type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} className="input input-mono" />
          </div>
          {errors.value && <p className="field-error">{errors.value}</p>}
        </fieldset>
        <div className="self-end border-l-4 border-ochre bg-ochre-wash p-3 text-small">
          Example: a {formatPrice(sample)} book becomes <span className="price">{formatPrice(sampleAfter)}</span>.
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
              <label key={v} className="flex min-h-11 items-center gap-2">
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
            <div className="max-h-72 overflow-auto border-2 border-ink p-2">
              {visible.map((b) => (
                <label key={b.id} className="flex min-h-11 items-center gap-3 hover:bg-paper-2">
                  <input
                    type="checkbox"
                    className="check"
                    checked={bookIds.includes(b.id)}
                    onChange={(e) => setBookIds((l) => (e.target.checked ? [...l, b.id] : l.filter((x) => x !== b.id)))}
                  />
                  <span className="micro w-20 text-ink-3">{b.book_code}</span>
                  <span className="min-w-0 flex-1 truncate">{b.title}</span>
                  <span className="price text-small">{formatPrice(b.price)}</span>
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
              <label key={c.id} className="flex min-h-11 items-center gap-2">
                <input type="checkbox" name="collectionIds" value={c.id} defaultChecked={o?.collectionIds.includes(c.id)} className="check" />
                {c.name}
              </label>
            ))}
            {errors.collectionIds && <p className="field-error">{errors.collectionIds}</p>}
          </fieldset>
        )}
      </FieldGroup>

      <FieldGroup title="When" description="Dhaka time. The site picks up the start and end within about 10 minutes.">
        <Field label="Starts" htmlFor="o-start" error={errors.start_at}>
          <input id="o-start" name="start_at" type="datetime-local" className="input input-mono" defaultValue={toDhakaInput(o?.start_at ?? new Date().toISOString())} />
        </Field>
        <Field label="Ends (optional)" htmlFor="o-end" error={errors.end_at}>
          <input id="o-end" name="end_at" type="datetime-local" className="input input-mono" defaultValue={toDhakaInput(o?.end_at)} />
        </Field>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="show_countdown" defaultChecked={o?.show_countdown ?? false} className="check" />
          Show a countdown
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={o?.is_active ?? true} className="check" />
          Active
        </label>
        {errors.show_countdown && <p className="field-error sm:col-span-2">{errors.show_countdown}</p>}
      </FieldGroup>

      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : o ? "Save offer" : "Create offer"}
      </button>
    </form>
  );
}
