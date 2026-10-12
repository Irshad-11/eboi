"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import { SECTIONS } from "@/config/analytics";
import { IconClose, IconPages } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { BuyButton } from "@/features/whatsapp/buy-button";
import type { MessageBook } from "@/features/whatsapp/message";

type Props = {
  book: MessageBook & { id: string; page_count: number | null; preview_page_count: number | null };
};

type State = { kind: "idle" } | { kind: "loading" } | { kind: "error" } | { kind: "ready"; pages: number; aspect: number };

const SECTION = SECTIONS.detailPreview;

/**
 * In-page preview reader.
 *
 * - pdf.js (legacy build, for older Android browsers) is loaded only when the
 *   reader taps "Open the preview": it costs nothing until then.
 * - Pages are drawn to <canvas> only as they approach the viewport.
 * - The PDF comes from a signed URL that expires in ~90 seconds. Range
 *   requests are disabled so the whole (small) file downloads at once and
 *   never needs the URL again after it expires.
 * - Download, print, right-click, drag and text selection are discouraged.
 *   This is friction, not protection: anything shown on a screen can be
 *   captured. The real protection is that only the first pages are uploaded.
 */
export function PreviewViewer({ book }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const docRef = useRef<PDFDocumentProxy | null>(null);
  // pdf.js v6 releases the worker and memory through the loading task.
  const taskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const maxSeen = useRef(0);
  const [current, setCurrent] = useState(1);
  const frameRef = useRef<HTMLDivElement>(null);

  const open = useCallback(async () => {
    setState({ kind: "loading" });
    track("preview_open", { bookId: book.id, section: SECTION });
    try {
      const [pdfjs, res] = await Promise.all([
        import("pdfjs-dist/legacy/build/pdf.mjs"),
        fetch(`/api/preview/${book.id}`, { cache: "no-store" }),
      ]);
      if (!res.ok) throw new Error(`preview ${res.status}`);
      const { url } = (await res.json()) as { url: string };
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const task = pdfjs.getDocument({ url, disableRange: true, disableStream: true, enableXfa: false });
      taskRef.current = task;
      const doc = await task.promise;
      docRef.current = doc;
      const first = await doc.getPage(1);
      const vp = first.getViewport({ scale: 1 });
      setState({ kind: "ready", pages: doc.numPages, aspect: vp.height / vp.width });
      requestAnimationFrame(() => frameRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      console.error("[preview]", err);
      setState({ kind: "error" });
    }
  }, [book.id]);

  const close = useCallback(() => {
    void taskRef.current?.destroy();
    taskRef.current = null;
    docRef.current = null;
    setState({ kind: "idle" });
  }, []);

  useEffect(() => () => void taskRef.current?.destroy(), []);

  // Best-effort: block Save and Print shortcuts while the reader is open.
  useEffect(() => {
    if (state.kind !== "ready") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "p"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.kind]);

  const onSeen = useCallback(
    (n: number) => {
      setCurrent(n);
      if (n > maxSeen.current) {
        maxSeen.current = n;
        track("preview_page", { bookId: book.id, section: SECTION, page: n });
      }
    },
    [book.id],
  );

  const previewPages = book.preview_page_count;

  if (state.kind !== "ready") {
    return (
      <div className="grid gap-6 border-2 border-ink bg-paper-raised p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
        <PageStack />
        <div>
          <p className="label text-ink-3">Free preview</p>
          <p className="mt-2 text-title font-semibold">
            {previewPages ? `Read the first ${previewPages} pages` : "Read the first pages"}
          </p>
          <p className="mt-2 max-w-prose text-ink-2">
            Opens right here. No sign-up, nothing to download. If you like the writing, the rest is one message away.
          </p>
          {state.kind === "error" && (
            <p className="field-error" role="alert">
              The preview did not load. Check your connection and try again.
            </p>
          )}
          <button
            type="button"
            onClick={open}
            disabled={state.kind === "loading"}
            className="btn btn-outline mt-5 w-full sm:w-auto"
            aria-busy={state.kind === "loading"}
          >
            <IconPages />
            {state.kind === "loading" ? "Opening the preview…" : state.kind === "error" ? "Try again" : "Open the preview"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={frameRef} className="scroll-mt-4">
      <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between gap-3 border-b-2 border-ink bg-paper/95 px-4 py-2 md:mx-0">
        <p className="label tnum">
          Preview <span className="text-ink-3">·</span> page {current} of {state.pages}
        </p>
        <button type="button" onClick={close} className="btn btn-quiet btn-sm">
          <IconClose size={18} />
          Close
        </button>
      </div>

      <div
        className="preview-frame no-copy mx-auto mt-6 max-w-[46rem] space-y-6"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {Array.from({ length: state.pages }, (_, i) => (
          <PdfPage key={i} doc={docRef.current!} n={i + 1} aspect={state.aspect} onSeen={onSeen} />
        ))}
      </div>
      <p className="preview-print-note hidden">The preview cannot be printed.</p>

      <div className="mx-auto mt-8 max-w-[46rem] border-t-[3px] border-ink pt-6">
        <p className="label text-ink-3">End of the preview</p>
        <p className="mt-2 text-title font-semibold">
          {book.page_count ? `The full PDF has ${book.page_count} pages.` : "The rest is in the full PDF."}
        </p>
        <BuyButton book={book} section={SECTION} className="mt-4 w-full sm:w-auto" />
      </div>
    </div>
  );
}

function PdfPage({
  doc,
  n,
  aspect,
  onSeen,
}: {
  doc: PDFDocumentProxy;
  n: number;
  aspect: number;
  onSeen: (n: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let cancelled = false;
    let task: { cancel: () => void } | null = null;

    // Draw when the page is within ~1.5 screens of the viewport.
    const near = new IntersectionObserver(
      async (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        near.disconnect();
        try {
          const page = await doc.getPage(n);
          if (cancelled || !canvasRef.current) return;
          const base = page.getViewport({ scale: 1 });
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale: (el.clientWidth / base.width) * dpr });
          const canvas = canvasRef.current;
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const render = page.render({ canvas, viewport });
          task = render;
          await render.promise;
          if (!cancelled) setDrawn(true);
        } catch {
          // Cancelled on unmount or a damaged page: leave the blank sheet.
        }
      },
      { rootMargin: "150% 0px" },
    );
    // Count a page as read when most of it is on screen.
    const seen = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && onSeen(n), {
      threshold: 0.55,
    });
    near.observe(el);
    seen.observe(el);
    return () => {
      cancelled = true;
      task?.cancel();
      near.disconnect();
      seen.disconnect();
    };
  }, [doc, n, onSeen]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full bg-paper-raised shadow-cover"
      style={{ aspectRatio: `1 / ${aspect}` }}
      aria-label={`Preview page ${n}`}
      role="img"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {!drawn && <span className="micro absolute inset-0 grid place-items-center text-ink-3">Page {n}</span>}
    </div>
  );
}

/** Three offset sheets: a hint of pages, drawn with the same rules as covers. */
function PageStack() {
  return (
    <div className="relative mx-auto h-28 w-20 sm:mx-0" aria-hidden="true">
      <span className="absolute inset-0 translate-x-3 translate-y-3 border-2 border-ink bg-paper-2" />
      <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 border-2 border-ink bg-paper-raised" />
      <span className="absolute inset-0 border-2 border-ink bg-paper-raised p-2.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="mb-1.5 block h-[3px] bg-ink-3" style={{ width: `${[90, 100, 75, 100, 85, 60][i]}%` }} />
        ))}
      </span>
    </div>
  );
}
