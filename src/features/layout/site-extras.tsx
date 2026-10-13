"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { langOf } from "@/lib/bangla";
import { IconArrowUp, IconClose, IconWhatsApp } from "@/components/icons";
import { useModalState } from "@/components/ui/dialog";
import { PriceTag } from "@/features/books/components/price-tag";
import type { BookLite } from "@/features/books/types";
import { useShop } from "./shop-context";
import { whatsappLink } from "@/features/whatsapp/message";

/* ---------------------------------------------------------------------------
 * Pop-up notice (offer, news, latest books). Admin > Notices and features.
 * ------------------------------------------------------------------------- */

export type PopupProps = {
  version: number;
  title: string;
  body: string;
  image: string | null;
  buttonLabel: string;
  link: string;
  books: BookLite[];
  delay: number;
  autoclose: number;
  frequency: "session" | "day" | "always";
};

const POPUP_KEY = "eboi_popup";

function alreadySeen(version: number, frequency: PopupProps["frequency"]): boolean {
  if (frequency === "always") return false;
  try {
    const store = frequency === "session" ? sessionStorage : localStorage;
    const raw = store.getItem(POPUP_KEY);
    if (!raw) return false;
    const [v, day] = raw.split("|");
    if (Number(v) !== version) return false;
    return frequency === "session" || day === new Date().toDateString();
  } catch {
    return false;
  }
}

function markSeen(version: number, frequency: PopupProps["frequency"]) {
  if (frequency === "always") return;
  try {
    const store = frequency === "session" ? sessionStorage : localStorage;
    store.setItem(POPUP_KEY, `${version}|${new Date().toDateString()}`);
  } catch {
    // storage blocked: it may show again, which is acceptable
  }
}

export function PromoPopup(p: PopupProps) {
  const { currency_symbol } = useShop();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(p.autoclose);
  const [hold, setHold] = useState(false);
  useModalState(ref, open);

  useEffect(() => {
    if (alreadySeen(p.version, p.frequency)) return;
    const t = setTimeout(() => {
      setLeft(p.autoclose);
      setOpen(true);
    }, Math.max(0, p.delay) * 1000);
    return () => clearTimeout(t);
  }, [p.version, p.frequency, p.delay, p.autoclose]);

  const close = () => {
    setOpen(false);
    markSeen(p.version, p.frequency);
  };

  // Optional auto-close, paused while the mouse is over the pop-up.
  useEffect(() => {
    if (!open || p.autoclose <= 0 || hold) return;
    const t = setTimeout(() => {
      if (left <= 1) {
        setOpen(false);
        markSeen(p.version, p.frequency);
      } else setLeft(left - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [open, left, hold, p.autoclose, p.version, p.frequency]);

  const external = /^https?:\/\//.test(p.link);
  const cta =
    p.buttonLabel && p.link ? (
      external ? (
        <a href={p.link} target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-block bg-sale text-white hover:bg-sale-hover" onClick={close}>
          {p.buttonLabel}
        </a>
      ) : (
        <Link href={p.link} className="btn btn-lg btn-block bg-sale text-white hover:bg-sale-hover" onClick={close}>
          {p.buttonLabel}
        </Link>
      )
    ) : null;

  return (
    <dialog
      ref={ref}
      className="dialog promo-dialog"
      aria-labelledby="promo-title"
      onClose={close}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === ref.current && close()}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHold(false)}
    >
      <div className="relative">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin image or GIF, shown as it is
          <img src={p.image} alt="" className="block max-h-[45vh] w-full bg-muted object-cover" />
        ) : (
          <div className="h-2 bg-sale" aria-hidden="true" />
        )}
        <button type="button" onClick={close} className="absolute top-2 right-2 inline-flex size-9 items-center justify-center rounded-full bg-white/95 text-text shadow-md hover:bg-white" aria-label="Close">
          <IconClose size={18} />
        </button>
      </div>
      <div className="px-5 pt-4 pb-5">
        {p.title && (
          <h2 id="promo-title" className="text-xl font-bold text-sale">
            {p.title}
          </h2>
        )}
        {p.body && <p className="mt-1.5 text-base whitespace-pre-line text-text-2">{p.body}</p>}
        {p.books.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-3">
            {p.books.slice(0, 3).map((b) => (
              <li key={b.id}>
                <Link href={`/books/${b.slug}`} onClick={close} className="group block">
                  <div className="cover-frame">
                    {b.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- small cover thumbnails in a pop-up
                      <img src={b.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-end bg-brand p-2 text-xs font-semibold text-white">{b.title}</span>
                    )}
                  </div>
                  <p lang={langOf(b.title)} className="mt-1.5 line-clamp-2 text-sm leading-snug font-medium group-hover:text-brand">
                    {b.title}
                  </p>
                  <PriceTag pricing={b.pricing} symbol={currency_symbol} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {cta && <div className="mt-5">{cta}</div>}
        {!cta && (
          <button type="button" onClick={close} className="btn btn-secondary btn-block mt-5">
            Continue shopping
          </button>
        )}
        {p.autoclose > 0 && (
          <div className="mt-3" aria-live="off">
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-sale transition-[width] duration-1000 ease-linear" style={{ width: `${(left / p.autoclose) * 100}%` }} />
            </div>
            <p className="mt-1 text-center text-xs text-text-3">{hold ? "Paused" : `Closes in ${left}s`}</p>
          </div>
        )}
      </div>
    </dialog>
  );
}

/* ---------------------------------------------------------------------------
 * Floating WhatsApp button and back-to-top.
 * ------------------------------------------------------------------------- */

export function FloatingTools({ whatsapp, backToTop }: { whatsapp: boolean; backToTop: boolean }) {
  const { whatsapp_number } = useShop();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!backToTop) return;
    const onScroll = () => setScrolled(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [backToTop]);

  const showWa = whatsapp && Boolean(whatsapp_number);
  if (!showWa && !backToTop) return null;
  return (
    <div className="floating-tools fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-2 md:right-6 md:bottom-6">
      {backToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-text shadow-md transition-all hover:text-brand",
            scrolled ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0",
          )}
          tabIndex={scrolled ? 0 : -1}
        >
          <IconArrowUp size={20} />
        </button>
      )}
      {showWa && (
        <a
          href={whatsappLink(whatsapp_number, "Hi eBoi!")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="inline-flex size-13 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition-transform hover:scale-105"
        >
          <IconWhatsApp size={28} />
        </a>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Recent order notice: real orders from the sales log, no buyer details.
 * ------------------------------------------------------------------------- */

type Sale = { title: string; slug: string; coverUrl: string | null; at: string };

function ago(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

const TOAST_KEY = "eboi_sales_toast_off";

export function RecentSalesToast({ sales }: { sales: Sale[] }) {
  const [i, setI] = useState(-1);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!sales.length) return;
    try {
      if (sessionStorage.getItem(TOAST_KEY)) return;
    } catch {
      // ignore
    }
    // First notice after 12s, then one every 25s, at most 4 per page view.
    if (shown >= 4) return;
    const t = setTimeout(() => {
      setI((n) => (n + 1) % sales.length);
      setShown((n) => n + 1);
    }, shown === 0 ? 12000 : 25000);
    return () => clearTimeout(t);
  }, [sales, shown]);

  // Each notice stays for 6 seconds.
  useEffect(() => {
    if (i < 0) return;
    const t = setTimeout(() => setI(-1), 6000);
    return () => clearTimeout(t);
  }, [i, shown]);

  const sale = i >= 0 ? sales[i] : null;
  return (
    <div className="sales-toast fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-30 md:bottom-6 md:left-6" aria-live="polite">
      {sale && (
        <div className="flex w-[17.5rem] items-center gap-3 rounded-lg border border-line bg-white p-2.5 pr-8 shadow-lg">
          <Link href={`/books/${sale.slug}`} className="flex min-w-0 items-center gap-3" onClick={() => setI(-1)}>
            <span className="cover-frame w-10 shrink-0">
              {sale.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- tiny cover thumbnail
                <img src={sale.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 bg-brand" />
              )}
            </span>
            <span className="min-w-0 text-sm">
              <span lang={langOf(sale.title)} className="line-clamp-1 font-semibold">
                {sale.title}
              </span>
              <span className="text-text-3">Ordered {ago(sale.at)}</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Hide order notices"
            className="absolute top-1 right-1 inline-flex size-7 items-center justify-center rounded-md text-text-3 hover:bg-muted hover:text-text"
            onClick={() => {
              setI(-1);
              setShown(99);
              try {
                sessionStorage.setItem(TOAST_KEY, "1");
              } catch {
                // ignore
              }
            }}
          >
            <IconClose size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
