"use client";

import { useState, useTransition } from "react";
import { announcePreviewChange } from "./preview-panel";
import { useRouter } from "next/navigation";
import { IconArrowDown, IconArrowUp, IconClose, IconPlus } from "@/components/icons";
import { setCollectionBooks } from "../actions/collections";
import { AdminCard } from "./admin-page-head";
import { Notice } from "./notice";

type Book = { id: string; title: string; book_code: string; status: string };

/** Pick the books in a collection and set their order. */
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
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <AdminCard
      title={`Books (${ids.length})`}
      actions={
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!dirty}
          data-loading={pending}
          onClick={() =>
            start(async () => {
              const res = await setCollectionBooks(collectionId, ids);
              setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
              if (res.ok) {
              router.refresh();
              announcePreviewChange();
            }
            })
          }
        >
          {dirty ? "Save books" : "Saved"}
        </button>
      }
    >
      {notice && <Notice tone={notice.tone} className="mb-3">{notice.text}</Notice>}
      <div className="mb-3 flex gap-2">
        <label htmlFor="add-book" className="sr-only">
          Add a book
        </label>
        <select id="add-book" value={pick} onChange={(e) => setPick(e.target.value)} className="select">
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
          className="btn btn-secondary shrink-0"
          disabled={!pick}
          onClick={() => {
            setIds((l) => [...l, pick]);
            setPick("");
          }}
        >
          <IconPlus size={16} /> Add
        </button>
      </div>
      {ids.length === 0 ? (
        <p className="text-sm text-text-3">No books in this collection.</p>
      ) : (
        <ol className="divide-y divide-line rounded-md border border-line">
          {ids.map((id, i) => {
            const b = byId.get(id);
            return (
              <li key={id} className="flex items-center gap-2 px-2 py-1.5">
                <span className="w-6 text-center text-sm text-text-3 tnum">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-base">{b?.title ?? "Deleted book"}</span>
                  <span className="text-sm text-text-3">
                    {b?.book_code}
                    {b?.status === "draft" && " · draft"}
                  </span>
                </span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn btn-ghost btn-icon btn-sm" aria-label="Move up">
                  <IconArrowUp size={16} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === ids.length - 1} className="btn btn-ghost btn-icon btn-sm" aria-label="Move down">
                  <IconArrowDown size={16} />
                </button>
                <button type="button" onClick={() => setIds((l) => l.filter((x) => x !== id))} className="btn btn-ghost btn-icon btn-sm text-sale hover:text-sale" aria-label="Remove from collection">
                  <IconClose size={16} />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </AdminCard>
  );
}
