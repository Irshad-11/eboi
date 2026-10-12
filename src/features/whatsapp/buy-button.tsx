"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { publicEnv } from "@/lib/env";
import { IconChat } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { useShop } from "@/features/layout/shop-context";
import { buildSingleMessage, type MessageBook } from "./message";
import { WhatsAppSheet } from "./whatsapp-sheet";

type Props = {
  book: MessageBook & { id: string };
  section: string;
  label?: string;
  variant?: "primary" | "on-dark" | "outline";
  className?: string;
};

/** The main call to action on every book. */
export function BuyButton({ book, section, label = "Get it on WhatsApp", variant = "primary", className }: Props) {
  const shop = useShop();
  const [open, setOpen] = useState(false);
  const message = buildSingleMessage(shop.whatsapp_template, book, shop.currency_symbol, publicEnv.siteUrl);

  return (
    <>
      <button
        type="button"
        className={cn("btn", `btn-${variant}`, className)}
        onClick={() => {
          setOpen(true);
          track("whatsapp_click", { bookId: book.id, section });
        }}
      >
        <IconChat />
        {label}
      </button>
      <WhatsAppSheet open={open} onClose={() => setOpen(false)} message={message} bookIds={[book.id]} section={section} />
    </>
  );
}
