"use client";

import Link from "next/link";
import { useState } from "react";
import { SECTIONS } from "@/config/analytics";
import { IconClose, IconHeart, IconTrash, IconWhatsApp } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { useShop } from "@/features/layout/shop-context";
import { useMoney } from "@/features/region/use-region";
import { CompactCard } from "@/features/books/components/compact-card";
import type { BookLite } from "@/features/books/types";
import { OrderDialog } from "@/features/whatsapp/order-dialog";
import { useOrderMessage } from "@/features/whatsapp/use-order-message";
import { addToList, clearList, removeFromList, useMyList } from "./store";
import { useBooksByIds } from "./use-books";

/** My List: saved books, sent together in one WhatsApp message. Not a cart. */
export function MyListView() {
  const ids = useMyList();
  const { books, loading } = useBooksByIds(ids);
  // The list just cleared, so one tap can bring it back.
  const [undo, setUndo] = useState<string[] | null>(null);

  if (!ids.length) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-line bg-white px-6 py-12 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-sale-soft text-sale">
          <IconHeart size={22} />
        </span>
        <p className="mt-3 text-md font-semibold">{undo ? "Your list was cleared" : "Your list is empty"}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {undo && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                [...undo].reverse().forEach(addToList);
                setUndo(null);
              }}
            >
              Undo
            </button>
          )}
          <Link href="/shop" className="btn btn-primary">
            Browse books
          </Link>
        </div>
      </div>
    );
  }
  if (loading && !books.length) {
    return (
      <div className="space-y-3" aria-busy="true">
        {ids.slice(0, 3).map((id) => (
          <div key={id} className="skeleton h-24 rounded-lg" />
        ))}
      </div>
    );
  }
  return (
    <ListWithSend
      books={books}
      removable
      onClear={() => {
        setUndo(ids);
        clearList();
      }}
    />
  );
}

export function ListWithSend({ books, removable = false, onClear }: { books: BookLite[]; removable?: boolean; onClear?: () => void }) {
  const shop = useShop();
  const money = useMoney();
  const [open, setOpen] = useState(false);
  const sum = money.total(books.map((b) => b.pricing));
  const total = sum.final;
  const before = sum.was;
  const message = useOrderMessage().list(books);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <ul className="divide-y divide-line rounded-lg border border-line bg-white" data-section={SECTIONS.myList}>
        {books.map((b) => (
          <li key={b.id} className="p-3 sm:p-4">
            <CompactCard
              book={b}
              symbol={shop.currency_symbol}
              action={
                removable ? (
                  <button
                    type="button"
                    onClick={() => removeFromList(b.id)}
                    className="btn btn-ghost btn-icon btn-sm shrink-0"
                    aria-label={`Remove ${b.title}`}
                  >
                    <IconClose size={18} />
                  </button>
                ) : undefined
              }
            />
          </li>
        ))}
      </ul>

      <aside className="rounded-lg border border-line bg-white p-4 lg:sticky lg:top-24">
        <dl className="space-y-1.5 text-base">
          <div className="flex justify-between">
            <dt className="text-text-3">Books</dt>
            <dd className="tnum">{books.length}</dd>
          </div>
          {before > total && (
            <div className="flex justify-between">
              <dt className="text-text-3">Discount</dt>
              <dd className="text-sale tnum">−{money.fmt(Math.round((before - total) * 100) / 100, sum.usd)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-md font-semibold">
            <dt>Total</dt>
            <dd className="tnum">{money.fmt(total, sum.usd)}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="btn btn-primary btn-block mt-4"
          onClick={() => {
            setOpen(true);
            books.forEach((b) => track("whatsapp_click", { bookId: b.id, section: SECTIONS.myList }));
          }}
        >
          <IconWhatsApp size={18} />
          Order all on WhatsApp
        </button>
        {onClear && (
          <button type="button" className="btn btn-ghost btn-block mt-2 text-sale hover:bg-sale-soft hover:text-sale" onClick={onClear}>
            <IconTrash size={16} />
            Clear list
          </button>
        )}
      </aside>

      <OrderDialog open={open} onClose={() => setOpen(false)} message={message} bookIds={books.map((b) => b.id)} section={SECTIONS.myList} title="Order your list" />
    </div>
  );
}
