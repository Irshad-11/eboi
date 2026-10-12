"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconClose } from "@/components/icons";
import { setCollectionBooks } from "../actions/collections";
import { Notice } from "./notice";

type Book = { id: string; title: string; book_code: string; status: string };

/** Hand-ordering for a collection: move up, move down, remove, add. */
export function CollectionBooksEditor({ collectionId, initial, books }: { collectionId: string; initial: string[]; books: Book[] }) {
  const router = useRouter();
  const [ids, setIds] = useState(initial);
  const [pick, setPick] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const byId = new Map(books.map((b) => [b.id, b]));
  const dirty = ids.join() !== initial.join();

  const move = (i: number, d: -1 | 1) =>
    setIds((list) => {
      const next = [...list];
      const j = i + d;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <section className="border-t-[3px] border-ink pt-5" aria-labelledby="cb-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="cb-title" className="text-title font-semibold">
          Books in this collection ({ids.length})
        </h2>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!dirty || pending}
          onClick={() =>
            start(async () => {
              const res = await setCollectionBooks(collectionId, ids);
              setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
              if (res.ok) router.refresh();
            })
          }
        >
          {pending ? "Saving…" : dirty ? "Save order" : "Saved"}
        </button>
      </div>
      {notice && <Notice tone={notice.tone} className="mt-4">{notice.text}</Notice>}

      <ol className="mt-4 border-t border-ink">
        {ids.map((id, i) => {
          const b = byId.get(id);
          return (
            <li key={id} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-ink py-1.5">
              <span className="micro text-ink-3 tnum">{i + 1}</span>
              <span className="min-w-0">
                <span className="line-clamp-1 font-semibold">{b?.title ?? "Deleted book"}</span>
                <span className="micro text-ink-3">
                  {b?.book_code} {b?.status === "draft" && "· draft (hidden)"}
                </span>
              </span>
              <span className="flex">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="inline-flex size-11 items-center justify-center font-mono hover:bg-paper-2 disabled:opacity-30" aria-label="Move up">
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === ids.length - 1} className="inline-flex size-11 items-center justify-center font-mono hover:bg-paper-2 disabled:opacity-30" aria-label="Move down">
                  ↓
                </button>
                <button type="button" onClick={() => setIds((l) => l.filter((x) => x !== id))} className="inline-flex size-11 items-center justify-center text-rust hover:bg-rust-wash" aria-label="Remove from collection">
                  <IconClose size={16} />
                </button>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <label htmlFor="add-book" className="sr-only">
          Add a book
        </label>
        <select id="add-book" value={pick} onChange={(e) => setPick(e.target.value)} className="select max-w-md">
          <option value="">Add a book…</option>
          {books
            .filter((b) => !ids.includes(b.id))
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.book_code} · {b.title}
              </option>
            ))}
        </select>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={!pick}
          onClick={() => {
            setIds((l) => [...l, pick]);
            setPick("");
          }}
        >
          Add
        </button>
      </div>
    </section>
  );
}
