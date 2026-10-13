"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { IconWhatsApp } from "@/components/icons";
import { track } from "@/features/analytics/client";
import type { MessageBook } from "./message";
import { OrderDialog } from "./order-dialog";
import { useOrderMessage } from "./use-order-message";

type Props = {
  book: MessageBook & { id: string };
  section: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** Primary call to action on every book: opens the order dialog. */
export function BuyButton({ book, section, label = "Order on WhatsApp", size = "md", className }: Props) {
  const [open, setOpen] = useState(false);
  const message = useOrderMessage().single(book);

  return (
    <>
      <button
        type="button"
        className={cn("btn btn-primary", size === "lg" && "btn-lg", size === "sm" && "btn-sm", className)}
        onClick={() => {
          setOpen(true);
          track("whatsapp_click", { bookId: book.id, section });
        }}
      >
        <IconWhatsApp size={size === "sm" ? 16 : 18} />
        {label}
      </button>
      <OrderDialog open={open} onClose={() => setOpen(false)} message={message} bookIds={[book.id]} section={section} />
    </>
  );
}

/** "Buy together": one WhatsApp order for several books (the list message template). */
export function BundleButton({ books, section, className }: { books: (MessageBook & { id: string })[]; section: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const message = useOrderMessage().list(books);
  return (
    <>
      <button
        type="button"
        className={cn("btn btn-primary", className)}
        onClick={() => {
          setOpen(true);
          track("whatsapp_click", { bookId: books[0]?.id, section });
        }}
      >
        <IconWhatsApp size={18} />
        Order all {books.length} on WhatsApp
      </button>
      <OrderDialog open={open} onClose={() => setOpen(false)} message={message} bookIds={books.map((b) => b.id)} section={section} title="Order these books" />
    </>
  );
}
