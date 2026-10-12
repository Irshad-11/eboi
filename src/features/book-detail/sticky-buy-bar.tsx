"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { SECTIONS } from "@/config/analytics";
import { useShop } from "@/features/layout/shop-context";
import { PriceTag } from "@/features/books/components/price-tag";
import { BuyButton } from "@/features/whatsapp/buy-button";
import type { MessageBook } from "@/features/whatsapp/message";

/**
 * Mobile only. Appears once the main buy box has scrolled away and hides
 * again over the footer, so the button is always under the thumb but never
 * covers the page's own call to action.
 */
export function StickyBuyBar({ book, targetId }: { book: MessageBook & { id: string }; targetId: string }) {
  const { currency_symbol } = useShop();
  const [pastBox, setPastBox] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const box = document.getElementById(targetId);
    const footer = document.querySelector("footer");
    if (!box || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === box) setPastBox(!e.isIntersecting && e.boundingClientRect.top < 0);
        else setAtFooter(e.isIntersecting);
      }
    });
    io.observe(box);
    if (footer) io.observe(footer);
    return () => io.disconnect();
  }, [targetId]);

  const show = pastBox && !atFooter;
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-ink bg-paper px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition-transform duration-200 lg:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!show}
      inert={!show}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-small font-semibold">{book.title}</p>
          <PriceTag pricing={book.pricing} symbol={currency_symbol} size="sm" />
        </div>
        <BuyButton book={book} section={SECTIONS.detailSticky} label="Get it" className="shrink-0 px-4" />
      </div>
    </div>
  );
}
