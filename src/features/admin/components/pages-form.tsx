"use client";

import { useState, useTransition } from "react";
import { announcePreviewChange } from "./preview-panel";
import { useRouter } from "next/navigation";
import type { FaqItem } from "@/features/settings/schema";
import { savePagesContent } from "../actions/settings";
import { AdminCard } from "./admin-page-head";
import { ListEditor } from "./list-editor";
import { Notice } from "./notice";
import { RichTextEditor } from "./rich-text-editor";

type Props = { about: string; terms: string; howToOrder: string; faq: FaqItem[] };

/** About, How to order, Refund/Terms (rich text) and FAQ items. */
export function PagesForm(props: Props) {
  const router = useRouter();
  const [about, setAbout] = useState(props.about);
  const [terms, setTerms] = useState(props.terms);
  const [howToOrder, setHowToOrder] = useState(props.howToOrder);
  const [faq, setFaq] = useState(props.faq);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4 pb-20"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await savePagesContent({ about_content: about, terms_content: terms, how_to_order_content: howToOrder, faq_items: faq });
          setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: `${res.error} ${Object.values(res.fieldErrors ?? {})[0] ?? ""}` });
          if (res.ok) {
              router.refresh();
              announcePreviewChange();
            }
        });
      }}
    >
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <AdminCard title="About us" description="/about">
        <RichTextEditor id="pg-about" value={about} onChange={setAbout} />
      </AdminCard>
      <AdminCard title="How to order" description="/how-to-order: extra text under the steps and payment numbers">
        <RichTextEditor id="pg-order" value={howToOrder} onChange={setHowToOrder} minHeight={8} />
      </AdminCard>
      <AdminCard title="Refund policy and terms" description="/terms">
        <RichTextEditor id="pg-terms" value={terms} onChange={setTerms} />
      </AdminCard>
      <AdminCard title="FAQ" description="/faq and the home page. Also sent to Google as FAQ data.">
        <ListEditor<FaqItem>
          items={faq}
          onChange={setFaq}
          blank={() => ({ q: "", a: "" })}
          addLabel="Add question"
          max={40}
          render={(f, upd, i) => (
            <div className="space-y-2">
              <input aria-label={`Question ${i + 1}`} placeholder="Question" className="input font-semibold" value={f.q} onChange={(e) => upd({ q: e.target.value })} />
              <textarea aria-label={`Answer ${i + 1}`} placeholder="Answer" rows={3} className="textarea min-h-20" value={f.a} onChange={(e) => upd({ a: e.target.value })} />
            </div>
          )}
        />
      </AdminCard>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 py-3 lg:left-[15.5rem]">
        <div className="mx-auto flex max-w-6xl justify-end">
          <button className="btn btn-primary" data-loading={pending} disabled={pending}>
            Save pages
          </button>
        </div>
      </div>
    </form>
  );
}
