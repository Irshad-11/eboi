"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { SECTIONS } from "@/config/analytics";
import { useShop } from "@/features/layout/shop-context";
import { PriceTag } from "@/features/books/components/price-tag";
import { BuyButton } from "@/features/whatsapp/buy-button";
import type { MessageBook } from "@/features/whatsapp/message";

/** Phone only: price and Order button once the main buy area has scrolled away. */
export function StickyBuyBar({ book, targetId }: { book: MessageBook & { id: string }; targetId: string }) {
  const { currency_symbol } = useShop();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const box = document.getElementById(targetId);
    const footer = document.querySelector("footer");
    if (!box || !("IntersectionObserver" in window)) return;
    let past = false;
    let atFooter = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === box) past = !e.isIntersecting && e.boundingClientRect.top < 0;
        else atFooter = e.isIntersecting;
      }
      setShow(past && !atFooter);
    });
    io.observe(box);
    if (footer) io.observe(footer);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-4px_14px_rgb(16_24_20/0.08)] transition-transform duration-200 lg:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!show}
      inert={!show}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <PriceTag pricing={book.pricing} symbol={currency_symbol} size="md" className="flex-col gap-0" />
        <BuyButton book={book} section={SECTIONS.detailSticky} label="Order on WhatsApp" className="ml-auto flex-1" />
      </div>
    </div>
  );
}
