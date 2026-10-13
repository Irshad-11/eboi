"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconSearch, IconClose, IconWhatsApp } from "@/components/icons";
import { SECTIONS } from "@/config/analytics";
import { track } from "@/features/analytics/client";
import { whatsappLink } from "@/features/whatsapp/message";
import { useShop } from "./shop-context";
import { CompactCard } from "@/features/books/components/compact-card";
import type { BookLite } from "@/features/books/types";

/** How long typing must pause before a term counts as a real search. */
const SETTLE_MS = 2500;

/**
 * Logs a typed search as a "search" event even without Enter, but only when
 * it looks intentional: at least 3 characters, containing a letter or digit,
 * and the visitor stopped typing (or left the box, or opened a result).
 * Half-typed words never reach Admin > Search terms.
 */
function logTypedSearch(term: string, resultCount: number) {
  const t = term.trim();
  if (t.length < 3 || !/[\p{L}\p{N}]/u.test(t)) return;
  track("search", { term: t.slice(0, 80), resultCount, section: SECTIONS.searchSuggest, dedupe: `search|${t.toLowerCase()}` });
}

/**
 * Header search with live suggestions (cover, title, price). Arrow keys move
 * through results, Enter opens one, Escape closes. Submitting goes to the shop.
 * An empty box shows popular searches; no match offers to ask on WhatsApp.
 */
export function SearchBox({ autoFocus, onDone, className }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const router = useRouter();
  const { currency_symbol, trending_searches, features, whatsapp_number } = useShop();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState<{ q: string; books: BookLite[]; total: number }>({ q: "", books: [], total: 0 });

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json() as Promise<{ books: BookLite[]; total: number }>)
        .then((d) => {
          setResult({ q: term, ...d });
          setActive(-1);
        })
        .catch(() => undefined);
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  // Typed searches count once typing pauses on a term with known results.
  useEffect(() => {
    if (!result.q || result.q !== q.trim()) return;
    const t = setTimeout(() => logTypedSearch(result.q, result.total), SETTLE_MS);
    return () => clearTimeout(t);
  }, [result, q]);

  const term = q.trim();
  const show = open && term.length >= 2 && result.q === term;
  const books = show ? result.books : [];
  const trending = features.trending_searches ? trending_searches : [];
  const showTrending = open && term.length === 0 && trending.length > 0;

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!term) return;
    setOpen(false);
    onDone?.();
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  }

  return (
    <form role="search" onSubmit={submit} className={cn("relative", className)}>
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search books
      </label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        type="search"
        value={q}
        placeholder="Search by title, author or Book ID"
        autoComplete="off"
        enterKeyHint="search"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (result.q && result.q === term) logTypedSearch(result.q, result.total);
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(books.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(-1, a - 1));
          } else if (e.key === "Enter" && active >= 0 && books[active]) {
            e.preventDefault();
            setOpen(false);
            onDone?.();
            router.push(`/books/${books[active]!.slug}`);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="input h-11 rounded-full border-line-2 bg-muted pr-24 pl-4 hover:bg-white focus:bg-white [&::-webkit-search-cancel-button]:hidden"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-12 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-text-3 hover:bg-line hover:text-text"
          aria-label="Clear search"
        >
          <IconClose size={16} />
        </button>
      )}
      <button
        type="submit"
        className="absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover"
        aria-label="Search"
      >
        <IconSearch size={18} />
      </button>

      {show && (
        <div id={listId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-line bg-white shadow-lg">
          {books.length === 0 ? (
            <div className="px-4 py-3">
              <p className="text-sm font-semibold">No books match “{term}”</p>
              <p className="mt-0.5 text-sm text-text-3">Check the spelling, or try the author or Book ID.</p>
              {whatsapp_number && (
                <a
                  href={whatsappLink(whatsapp_number, `Hi eBoi! Do you have “${term}”?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => logTypedSearch(term, 0)}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                >
                  <IconWhatsApp size={16} className="text-whatsapp" />
                  Ask us for this book on WhatsApp
                </a>
              )}
              {trending.length > 0 && <TrendingChips terms={trending} onPick={(t) => { setQ(t); inputRef.current?.focus(); }} />}
            </div>
          ) : (
            <>
              <ul className="max-h-[60vh] overflow-y-auto py-1">
                {books.map((b, i) => (
                  <li
                    key={b.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={cn("px-3 py-2", i === active && "bg-muted")}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <CompactCard book={b} symbol={currency_symbol} dense onNavigate={() => {
                      logTypedSearch(term, result.total);
                      setOpen(false);
                      onDone?.();
                    }} />
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => submit()}
                className="block w-full border-t border-line px-4 py-2.5 text-left text-sm font-semibold text-brand hover:bg-muted"
              >
                {result.total === 1 ? "See result in the shop" : `See all ${result.total} results`}
              </button>
            </>
          )}
        </div>
      )}
      {showTrending && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-lg border border-line bg-white px-4 py-3 shadow-lg">
          <TrendingChips terms={trending} onPick={(t) => { setQ(t); inputRef.current?.focus(); }} />
        </div>
      )}
    </form>
  );
}

function TrendingChips({ terms, onPick }: { terms: string[]; onPick: (t: string) => void }) {
  return (
    <div className="mt-2 first:mt-0">
      <p className="text-sm font-semibold text-text-2">Popular searches</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {terms.map((t) => (
          <li key={t}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(t)}
              className="rounded-full border border-line bg-muted px-3 py-1 text-sm hover:border-brand hover:text-brand"
            >
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
