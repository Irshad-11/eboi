"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { langOf } from "@/lib/bangla";
import { IconArrowUp, IconClose, IconWhatsApp } from "@/components/icons";
import { useModalState } from "@/components/ui/dialog";
import { PriceTag } from "@/features/books/components/price-tag";
import type { BookLite } from "@/features/books/types";
import type { PopupFrequency } from "@/features/settings/schema";
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
  frequency: PopupFrequency;
};

const POPUP_KEY = "eboi_popup";
const VISITS_KEY = "eboi_visits";
/** A new visit starts after 30 minutes away (the usual analytics rule). */
const VISIT_GAP = 30 * 60 * 1000;
const EVERY = 5;

type VisitLog = { v: number; n: number; at: number; shown: number };

/**
 * Counts visits in this browser and says whether the pop-up is due:
 * on the first visit, then on every 5th visit after it (1st, 6th, 11th…).
 * A changed pop-up (new version) starts the count again.
 */
function dueByVisits(version: number): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem(VISITS_KEY) ?? "null") as VisitLog | null;
    const log: VisitLog = saved && saved.v === version ? saved : { v: version, n: 0, at: 0, shown: 0 };
    const now = Date.now();
    if (now - log.at > VISIT_GAP) log.n += 1;
    log.at = now;
    localStorage.setItem(VISITS_KEY, JSON.stringify(log));
    return log.n % EVERY === 1 && log.shown !== log.n;
  } catch {
    return false;
  }
}

function markShownByVisits(version: number) {
  try {
    const log = JSON.parse(localStorage.getItem(VISITS_KEY) ?? "null") as VisitLog | null;
    if (log && log.v === version) localStorage.setItem(VISITS_KEY, JSON.stringify({ ...log, shown: log.n }));
  } catch {
    // ignore
  }
}

function alreadySeen(version: number, frequency: PopupFrequency): boolean {
  if (frequency === "visits") return !dueByVisits(version);
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

function markSeen(version: number, frequency: PopupFrequency) {
  if (frequency === "visits") return markShownByVisits(version);
  try {
    const store = frequency === "session" ? sessionStorage : localStorage;
    store.setItem(POPUP_KEY, `${version}|${new Date().toDateString()}`);
  } catch {
    // storage blocked: it may show again, which is acceptable
  }
}

/** A small, clean card: image, title, a line of text, one button. Never scrolls. */
export function PromoPopup(p: PopupProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [hold, setHold] = useState(false);
  useModalState(ref, open);

  useEffect(() => {
    if (alreadySeen(p.version, p.frequency)) return;
    let t: ReturnType<typeof setTimeout>;
    // Never on top of something the visitor opened (preview, order, menu): wait until it is closed.
    const show = () => {
      if (document.querySelector("dialog[open]")) {
        t = setTimeout(show, 1500);
        return;
      }
      setOpen(true);
      // Counted as shown as soon as it appears, so a reload does not bring it back.
      markSeen(p.version, p.frequency);
    };
    t = setTimeout(show, Math.max(0, p.delay) * 1000);
    return () => clearTimeout(t);
  }, [p.version, p.frequency, p.delay]);

  const close = () => setOpen(false);

  const external = /^https?:\/\//.test(p.link);
  const ctaClass = "btn btn-lg btn-block bg-sale text-white hover:bg-sale-hover";
  const cta =
    p.buttonLabel && p.link ? (
      external ? (
        <a href={p.link} target="_blank" rel="noopener noreferrer" className={ctaClass} onClick={close}>
          {p.buttonLabel}
        </a>
      ) : (
        <Link href={p.link} className={ctaClass} onClick={close}>
          {p.buttonLabel}
        </Link>
      )
    ) : null;

  return (
    <dialog
      ref={ref}
      className="dialog promo-dialog"
      aria-labelledby={p.title ? "promo-title" : undefined}
      aria-label={p.title ? undefined : "Notice"}
      onClose={close}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === ref.current && close()}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHold(false)}
    >
      <button type="button" onClick={close} className="absolute top-2 right-2 z-10 inline-flex size-9 items-center justify-center rounded-full bg-white/95 text-text shadow-md hover:bg-white" aria-label="Close">
        <IconClose size={18} />
      </button>
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element -- admin image or GIF, shown as it is
        <img src={p.image} alt="" className="promo-image" />
      )}
      <div className="promo-body px-5 pt-5 pb-5 text-center">
        {p.title && (
          <h2 id="promo-title" className="pr-6 pl-6 text-xl leading-snug font-bold">
            {p.title}
          </h2>
        )}
        {p.body && <p className="mt-1.5 line-clamp-3 text-base text-text-2">{p.body}</p>}
        {p.books.length > 0 && (
          <ul className="promo-books mt-4 flex justify-center gap-3">
            {p.books.slice(0, 3).map((b) => (
              <li key={b.id} className="w-[4.5rem]">
                <Link href={`/books/${b.slug}`} onClick={close} className="block" title={b.title}>
                  <span className="cover-frame block">
                    {b.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- small cover thumbnails in a pop-up
                      <img src={b.coverUrl} alt={b.title} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <span lang={langOf(b.title)} className="absolute inset-0 flex items-end bg-brand p-1.5 text-xs font-semibold text-white">
                        {b.title}
                      </span>
                    )}
                  </span>
                  <PriceTag pricing={b.pricing} size="sm" className="mt-1 justify-center" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 space-y-1">
          {cta}
          <button type="button" onClick={close} className={cta ? "btn btn-ghost btn-block text-text-3" : "btn btn-secondary btn-block"}>
            {cta ? "Not now" : "Continue shopping"}
          </button>
        </div>
      </div>
      {p.autoclose > 0 && open && (
        // Optional auto-close: the line runs out, then the pop-up closes. Paused while the mouse is over it.
        <span className="promo-timer" data-paused={hold || undefined} style={{ animationDuration: `${p.autoclose}s` }} onAnimationEnd={close} aria-hidden="true" />
      )}
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
