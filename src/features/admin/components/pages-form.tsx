"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconClose } from "@/components/icons";
import type { FaqItem, HowToBuyStep } from "@/features/settings/schema";
import { savePagesContent } from "../actions/settings";
import { Field, FieldGroup } from "./field";
import { Notice } from "./notice";

type Props = { about: string; terms: string; faq: FaqItem[]; steps: HowToBuyStep[] };

const TEXT_HINT = "Blank line = new paragraph. A short line on its own = heading. Lines starting with “- ” = a list.";

/** About, FAQ, Refunds/Terms and How to Buy, all in one place. */
export function PagesForm(props: Props) {
  const router = useRouter();
  const [about, setAbout] = useState(props.about);
  const [terms, setTerms] = useState(props.terms);
  const [faq, setFaq] = useState(props.faq);
  const [steps, setSteps] = useState(props.steps);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const move = <T,>(list: T[], i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j]!, next[i]!];
    return next;
  };

  return (
    <form
      className="space-y-12"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await savePagesContent({ about_content: about, terms_content: terms, faq_items: faq, how_to_buy_steps: steps });
          setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
          setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
          if (res.ok) router.refresh();
        });
      }}
    >
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <FieldGroup title="About" description="The first paragraph is also the pull quote on the home page.">
        <Field label="About text" htmlFor="about" hint={TEXT_HINT} error={errors.about_content} className="sm:col-span-2">
          <textarea id="about" rows={10} className="textarea" value={about} onChange={(e) => setAbout(e.target.value)} />
        </Field>
      </FieldGroup>

      <FieldGroup title="How to buy" description="Also used for “How eBoi works” on the home page. Up to 8 steps.">
        <div className="space-y-4 sm:col-span-2">
          {steps.map((st, i) => (
            <div key={i} className="grid gap-2 border-l-4 border-green-900 pl-3 sm:grid-cols-[3rem_minmax(0,1fr)_auto]">
              <span className="text-[1.75rem] leading-none font-medium text-green-700 italic tnum">{String(i + 1).padStart(2, "0")}</span>
              <div className="space-y-2">
                <input aria-label={`Step ${i + 1} title`} className="input" value={st.title} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                <textarea aria-label={`Step ${i + 1} text`} rows={2} className="textarea min-h-0" value={st.body} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
              </div>
              <RowTools onUp={() => setSteps(move(steps, i, -1))} onDown={() => setSteps(move(steps, i, 1))} onRemove={() => setSteps(steps.filter((_, j) => j !== i))} />
            </div>
          ))}
          {errors.how_to_buy_steps && <p className="field-error">{errors.how_to_buy_steps}</p>}
          {steps.length < 8 && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setSteps([...steps, { title: "", body: "" }])}>
              <IconPlus size={16} /> Add step
            </button>
          )}
        </div>
      </FieldGroup>

      <FieldGroup title="FAQ" description="Each question also becomes FAQPage data for Google.">
        <div className="space-y-4 sm:col-span-2">
          {faq.map((f, i) => (
            <div key={i} className="grid gap-2 border-l-4 border-ink pl-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <input aria-label={`Question ${i + 1}`} placeholder="Question" className="input font-semibold" value={f.q} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                <textarea aria-label={`Answer ${i + 1}`} placeholder="Answer" rows={3} className="textarea min-h-0" value={f.a} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              </div>
              <RowTools onUp={() => setFaq(move(faq, i, -1))} onDown={() => setFaq(move(faq, i, 1))} onRemove={() => setFaq(faq.filter((_, j) => j !== i))} />
            </div>
          ))}
          {errors.faq_items && <p className="field-error">{errors.faq_items}</p>}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setFaq([...faq, { q: "", a: "" }])}>
            <IconPlus size={16} /> Add question
          </button>
        </div>
      </FieldGroup>

      <FieldGroup title="Refunds and terms">
        <Field label="Terms text" htmlFor="terms" hint={TEXT_HINT} error={errors.terms_content} className="sm:col-span-2">
          <textarea id="terms" rows={12} className="textarea" value={terms} onChange={(e) => setTerms(e.target.value)} />
        </Field>
      </FieldGroup>

      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save pages"}
      </button>
    </form>
  );
}

function RowTools({ onUp, onDown, onRemove }: { onUp: () => void; onDown: () => void; onRemove: () => void }) {
  return (
    <div className="flex sm:flex-col">
      <button type="button" onClick={onUp} className="inline-flex size-11 items-center justify-center font-mono hover:bg-paper-2" aria-label="Move up">
        ↑
      </button>
      <button type="button" onClick={onDown} className="inline-flex size-11 items-center justify-center font-mono hover:bg-paper-2" aria-label="Move down">
        ↓
      </button>
      <button type="button" onClick={onRemove} className="inline-flex size-11 items-center justify-center text-rust hover:bg-rust-wash" aria-label="Remove">
        <IconClose size={16} />
      </button>
    </div>
  );
}
