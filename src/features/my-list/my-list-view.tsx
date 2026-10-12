"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { SECTIONS } from "@/config/analytics";
import { publicEnv } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { IconChat, IconClose } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { useShop } from "@/features/layout/shop-context";
import { PriceTag } from "@/features/books/components/price-tag";
import type { BookLite } from "@/features/books/types";
import { buildListMessage } from "@/features/whatsapp/message";
import { WhatsAppSheet } from "@/features/whatsapp/whatsapp-sheet";
import { removeFromList, useMyList } from "./store";
import { useBooksByIds } from "./use-books";

/**
 * My List: a shortlist, not a cart. No quantities, no checkout. The point is
 * one WhatsApp message for several books.
 */
export function MyListView() {
  const ids = useMyList();
  const { books, loading } = useBooksByIds(ids);

  if (!ids.length) {
    return (
      <div className="max-w-xl border-t-[3px] border-ink pt-8">
        <p className="text-headline font-semibold">Nothing here yet.</p>
        <p className="mt-3 text-lead text-ink-2">
          Tap “Add to My List” on any book to keep it here. Then send the whole list in one WhatsApp message. The list lives
          in this browser only.
        </p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Find a book
        </Link>
      </div>
    );
  }

  if (loading && !books.length) {
    return <p className="label border-t-[3px] border-ink pt-6 text-ink-3">Loading your list…</p>;
  }

  return <ListWithSend books={books} removable />;
}

export function ListWithSend({ books, removable = false }: { books: BookLite[]; removable?: boolean }) {
  const shop = useShop();
  const [open, setOpen] = useState(false);
  const total = books.reduce((s, b) => s + b.pricing.final, 0);
  const before = books.reduce((s, b) => s + (b.pricing.was ?? b.pricing.final), 0);
  const message = buildListMessage(shop.whatsapp_list_template, books, shop.currency_symbol, publicEnv.siteUrl);

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <ul className="border-t-[3px] border-ink lg:col-span-8" data-section={SECTIONS.myList}>
        {books.map((b) => (
          <li key={b.id} className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-ink py-4">
            <Link href={`/books/${b.slug}`} className="book-link" data-book-id={b.id}>
              <div className="cover">{b.coverUrl && <Image src={b.coverUrl} alt={`Cover of ${b.title}`} fill sizes="64px" />}</div>
            </Link>
            <div className="min-w-0">
              <Link href={`/books/${b.slug}`} className="line-clamp-2 font-semibold hover:underline" data-book-id={b.id}>
                {b.title}
              </Link>
              <p className="micro mt-1 text-ink-3">
                {b.book_code} · {b.author}
              </p>
              <PriceTag pricing={b.pricing} symbol={shop.currency_symbol} size="sm" className="mt-1" />
            </div>
            {removable && (
              <button
                type="button"
                onClick={() => removeFromList(b.id)}
                className="inline-flex size-11 items-center justify-center hover:bg-paper-2"
                aria-label={`Remove ${b.title} from My List`}
              >
                <IconClose size={18} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <aside className="lg:col-span-4">
        <div className="border-2 border-ink bg-paper-raised p-5 lg:sticky lg:top-6">
          <p className="label text-ink-3">
            {books.length} {books.length === 1 ? "book" : "books"}
          </p>
          <p className="price mt-2 text-price">{formatPrice(total, shop.currency_symbol)}</p>
          {before > total && <p className="mt-1 text-small text-ochre-ink">You save {formatPrice(before - total, shop.currency_symbol)} with current offers.</p>}
          <button
            type="button"
            className="btn btn-primary btn-block mt-5"
            onClick={() => {
              setOpen(true);
              books.forEach((b) => track("whatsapp_click", { bookId: b.id, section: SECTIONS.myList }));
            }}
          >
            <IconChat />
            Send the list on WhatsApp
          </button>
          <p className="mt-4 text-small text-ink-3">One message, one reply with the total and how to pay.</p>
        </div>
      </aside>

      <WhatsAppSheet
        open={open}
        onClose={() => setOpen(false)}
        message={message}
        bookIds={books.map((b) => b.id)}
        section={SECTIONS.myList}
        title="Your list is ready to send"
      />
    </div>
  );
}
