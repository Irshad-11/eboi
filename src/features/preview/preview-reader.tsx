"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist/legacy/build/pdf.mjs";
import { SECTIONS } from "@/config/analytics";
import { cn } from "@/lib/cn";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconFitWidth,
  IconRefresh,
  IconZoomIn,
  IconZoomOut,
} from "@/components/icons";
import { track } from "@/features/analytics/client";
import { useShop } from "@/features/layout/shop-context";
import { PriceTag } from "@/features/books/components/price-tag";
import { BuyButton } from "@/features/whatsapp/buy-button";
import { useModalState } from "@/components/ui/dialog";
import type { ReaderBook } from "./reader-context";

const SECTION = SECTIONS.detailPreview;
const ZOOMS = [1, 1.25, 1.5, 2, 2.5, 3];

type Status = "loading" | "ready" | "error";
/** "page" fits the whole page on screen; "width" fills the width. Zoom multiplies either. */
type Fit = "page" | "width";

/**
 * Preview reader. Full screen on phones, a large modal on desktop.
 *
 * - pdf.js (legacy build, for older Android browsers) is loaded only here.
 * - The PDF comes from a signed URL that expires in about 90 seconds. Range
 *   requests are off so the small file downloads once, before it expires.
 * - The worker URL carries the library version, so a cached old worker can
 *   never be paired with a newer library (a common "worker version" error).
 * - Right-click, drag, text selection, Ctrl/Cmd+S and Ctrl/Cmd+P are blocked
 *   and printing hides the pages. Friction only: a screen can always be
 *   captured. Only the first pages are ever uploaded.
 */
export function PreviewReader({ book, startPage, onClose }: { book: ReaderBook; startPage: number; onClose: () => void }) {
  const { currency_symbol } = useShop();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const renderRef = useRef<RenderTask | null>(null);
  const maxSeen = useRef(0);
  const touchX = useRef<number | null>(null);

  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(startPage);
  const [fit, setFit] = useState<Fit>("page");
  const [zoom, setZoom] = useState(0);
  const [rendering, setRendering] = useState(false);

  useModalState(dialogRef, true);
  const pages = doc?.numPages ?? 0;
  const atEnd = pages > 0 && page > pages;

  // Load the document (again on retry).
  useEffect(() => {
    let cancelled = false;
    if (attempt === 0) track("preview_open", { bookId: book.id, section: SECTION });
    (async () => {
      try {
        const [pdfjs, res] = await Promise.all([
          import("pdfjs-dist/legacy/build/pdf.mjs"),
          fetch(`/api/preview/${book.id}`, { cache: "no-store" }),
        ]);
        if (!res.ok) throw new Error(`preview ${res.status}`);
        const { url } = (await res.json()) as { url: string };
        pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${pdfjs.version}`;
        const task = pdfjs.getDocument({ url, disableRange: true, disableStream: true, enableXfa: false });
        taskRef.current = task;
        const d = await task.promise;
        if (cancelled) return;
        setDoc(d);
        setPage((p) => Math.min(Math.max(1, p), d.numPages));
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("[preview]", err);
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, book.id]);

  useEffect(
    () => () => {
      renderRef.current?.cancel();
      void taskRef.current?.destroy();
    },
    [],
  );

  // Draw the current page whenever page, zoom, fit or the window size changes.
  const draw = useCallback(async () => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!doc || !stage || !canvas || page < 1 || page > doc.numPages) return;
    renderRef.current?.cancel();
    try {
      const p = await doc.getPage(page);
      setRendering(true);
      const base = p.getViewport({ scale: 1 });
      const pad = 24;
      const widthFit = (stage.clientWidth - pad) / base.width;
      const pageFit = Math.min(widthFit, (stage.clientHeight - pad) / base.height);
      const css = (fit === "width" ? widthFit : pageFit) * ZOOMS[zoom]!;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = p.getViewport({ scale: css * dpr });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
      const task = p.render({ canvas, viewport });
      renderRef.current = task;
      await task.promise;
      setRendering(false);
    } catch (err) {
      // A cancelled render is expected when the user moves on quickly.
      if ((err as { name?: string })?.name !== "RenderingCancelledException") {
        console.error("[preview] render", err);
        setRendering(false);
      }
    }
  }, [doc, page, fit, zoom]);

  useEffect(() => {
    // Next frame: the stage has its final size by then.
    const raf = requestAnimationFrame(() => void draw());
    const onResize = () => void draw();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [draw]);

  // Analytics: deepest page reached.
  useEffect(() => {
    if (status === "ready" && page <= pages && page > maxSeen.current) {
      maxSeen.current = page;
      track("preview_page", { bookId: book.id, section: SECTION, page });
    }
  }, [page, pages, status, book.id]);

  const go = useCallback(
    (d: 1 | -1) =>
      setPage((p) => {
        const n = Math.min(Math.max(1, p + d), pages + 1);
        return n;
      }),
    [pages],
  );

  // Keyboard: arrows to turn pages, +/- to zoom, and block save/print.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      if (status !== "ready") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(ZOOMS.length - 1, z + 1));
      else if (e.key === "-") setZoom((z) => Math.max(0, z - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, status]);

  const zoomed = zoom > 0 || fit === "width";

  return (
    <dialog
      ref={dialogRef}
      className="reader"
      aria-label={`Preview of ${book.title}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2 sm:px-4">
          <p className="min-w-0 flex-1 truncate text-base font-semibold">{book.title}</p>
          <button type="button" onClick={onClose} className="inline-flex size-10 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close preview">
            <IconClose size={20} />
          </button>
        </div>

        <div
          ref={stageRef}
          className={cn("no-copy reader-pages relative flex-1 overflow-auto", zoomed ? "" : "flex items-center justify-center")}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            touchX.current = zoomed ? null : (e.touches[0]?.clientX ?? null);
          }}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center p-6" aria-busy="true" aria-label="Loading preview">
              <div className="aspect-[2/3] h-[70%] max-h-[36rem] animate-pulse rounded-sm bg-white/10" />
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-base text-white/85">The preview could not be loaded.</p>
              <button type="button" className="btn btn-primary" onClick={() => {
                  setStatus("loading");
                  setAttempt((a) => a + 1);
                }}>
                <IconRefresh size={18} />
                Try again
              </button>
            </div>
          )}

          {status === "ready" && !atEnd && (
            <div className={cn("p-3", zoomed && "mx-auto w-fit")}>
              <canvas ref={canvasRef} className={cn("block bg-white shadow-lg transition-opacity", rendering && "opacity-70")} />
            </div>
          )}

          {status === "ready" && atEnd && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center text-text">
                <p className="text-md font-semibold">{book.title}</p>
                {book.page_count ? <p className="mt-1 text-sm text-text-3">Full book: {book.page_count} pages</p> : null}
                <PriceTag pricing={book.pricing} symbol={currency_symbol} size="lg" className="mt-3 justify-center" />
                <BuyButton book={book} section={SECTION} className="btn-block mt-4" />
                <button type="button" className="btn btn-ghost btn-block mt-2" onClick={() => setPage(1)}>
                  Back to page 1
                </button>
              </div>
            </div>
          )}

          {status === "ready" && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={page <= 1}
                className="absolute top-1/2 left-2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:hidden md:inline-flex"
                aria-label="Previous page"
              >
                <IconChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={atEnd}
                className="absolute top-1/2 right-2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:hidden md:inline-flex"
                aria-label="Next page"
              >
                <IconChevronRight size={22} />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4">
          <div className="flex items-center gap-1">
            <ToolButton label="Previous page" onClick={() => go(-1)} disabled={status !== "ready" || page <= 1}>
              <IconChevronLeft size={20} />
            </ToolButton>
            <span className="min-w-16 text-center text-sm text-white/85 tnum" aria-live="polite">
              {status === "ready" ? (atEnd ? `End` : `${page} / ${pages}`) : "…"}
            </span>
            <ToolButton label="Next page" onClick={() => go(1)} disabled={status !== "ready" || atEnd}>
              <IconChevronRight size={20} />
            </ToolButton>
          </div>
          <div className="flex items-center gap-1">
            <ToolButton label="Zoom out" onClick={() => setZoom((z) => Math.max(0, z - 1))} disabled={status !== "ready" || atEnd || zoom === 0}>
              <IconZoomOut size={20} />
            </ToolButton>
            <span className="hidden w-12 text-center text-sm text-white/70 sm:inline tnum">{Math.round(ZOOMS[zoom]! * 100)}%</span>
            <ToolButton label="Zoom in" onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} disabled={status !== "ready" || atEnd || zoom === ZOOMS.length - 1}>
              <IconZoomIn size={20} />
            </ToolButton>
            <ToolButton
              label={fit === "width" ? "Fit page" : "Fit to width"}
              pressed={fit === "width"}
              onClick={() => {
                setFit((f) => (f === "width" ? "page" : "width"));
                setZoom(0);
              }}
              disabled={status !== "ready" || atEnd}
            >
              <IconFitWidth size={20} />
            </ToolButton>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-md text-white/85 hover:bg-white/10 hover:text-white disabled:opacity-35 disabled:hover:bg-transparent",
        pressed && "bg-white/15 text-white",
      )}
    >
      {children}
    </button>
  );
}
