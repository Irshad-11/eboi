"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import type { CollectionRow } from "@/lib/supabase/database.types";
import { saveCollection } from "../actions/collections";
import { Field, FieldGroup } from "./field";
import { Notice } from "./notice";

const MOODS = [
  { value: "paper", label: "Paper", hint: "Light, double rule, newspaper columns, a shelf of covers." },
  { value: "forest", label: "Forest", hint: "A full-width deep green spread. Use for the one you want noticed." },
  { value: "ink", label: "Ink", hint: "A framed, numbered contents list. Dense and quiet." },
] as const;

export function CollectionForm({ collection }: { collection: CollectionRow | null }) {
  const router = useRouter();
  const [name, setName] = useState(collection?.name ?? "");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [touched, setTouched] = useState(Boolean(collection));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const c = collection;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await saveCollection(c?.id ?? null, {
        name,
        slug,
        description: String(fd.get("description") ?? ""),
        editorial_intro: String(fd.get("editorial_intro") ?? ""),
        mood: String(fd.get("mood") ?? "paper") as "paper",
        sort_order: String(fd.get("sort_order") ?? "0"),
        show_on_home: fd.get("show_on_home") === "on",
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setNotice({ tone: "error", text: res.error });
        return;
      }
      setErrors({});
      setNotice({ tone: "ok", text: res.message ?? "Saved." });
      if (!c) router.replace(`/admin/collections/${res.data.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10" noValidate>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <FieldGroup title="Collection" description="Collections are hand-ordered shelves. Best selling, Latest and Most viewed are automatic.">
        <Field label="Name" htmlFor="c-name" error={errors.name}>
          <input
            id="c-name"
            className="input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!touched) setSlug(slugify(e.target.value, ""));
            }}
          />
        </Field>
        <Field label="Slug (link)" htmlFor="c-slug" error={errors.slug} hint="Old links redirect if you change it.">
          <input
            id="c-slug"
            className="input input-mono"
            value={slug}
            onChange={(e) => {
              setTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
          />
        </Field>
        <Field label="Editorial intro" htmlFor="c-intro" error={errors.editorial_intro} hint="One or two sentences, in your voice. Shown large." className="sm:col-span-2">
          <textarea id="c-intro" name="editorial_intro" rows={3} className="textarea" defaultValue={c?.editorial_intro ?? ""} />
        </Field>
        <Field label="Longer description" htmlFor="c-desc" error={errors.description} hint="Optional. Shown on the collection page." className="sm:col-span-2">
          <textarea id="c-desc" name="description" rows={4} className="textarea" defaultValue={c?.description ?? ""} />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="field-label">Mood on the home page</legend>
          <div className="grid gap-3 md:grid-cols-3">
            {MOODS.map((m) => (
              <label key={m.value} className="flex cursor-pointer gap-3 border-2 border-ink p-3 has-[:checked]:bg-green-100">
                <input type="radio" name="mood" value={m.value} defaultChecked={(c?.mood ?? "paper") === m.value} className="check mt-1" />
                <span>
                  <span className="font-semibold">{m.label}</span>
                  <span className="block text-small text-ink-3">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Sort order" htmlFor="c-sort" hint="Lower comes first." error={errors.sort_order}>
          <input id="c-sort" name="sort_order" type="number" className="input input-mono" defaultValue={c?.sort_order ?? 0} />
        </Field>
        <label className="flex min-h-11 items-center gap-2 self-end">
          <input type="checkbox" name="show_on_home" defaultChecked={c?.show_on_home ?? true} className="check" />
          Show on the home page
        </label>
      </FieldGroup>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : c ? "Save collection" : "Create collection"}
      </button>
    </form>
  );
}
