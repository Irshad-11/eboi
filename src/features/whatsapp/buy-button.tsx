"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { publicEnv } from "@/lib/env";
import { IconWhatsApp } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { useShop } from "@/features/layout/shop-context";
import { buildSingleMessage, type MessageBook } from "./message";
import { OrderDialog } from "./order-dialog";

type Props = {
  book: MessageBook & { id: string };
  section: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** Primary call to action on every book: opens the order dialog. */
export function BuyButton({ book, section, label = "Order on WhatsApp", size = "md", className }: Props) {
  const shop = useShop();
  const [open, setOpen] = useState(false);
  const message = buildSingleMessage(shop.whatsapp_template, book, shop.currency_symbol, publicEnv.siteUrl);

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
