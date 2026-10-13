"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { IconClose, IconExternal, IconEye, IconRefresh } from "@/components/icons";

const EVENT = "eboi:preview-refresh";

/** Call after a successful save: an open preview reloads to show the change. */
export function announcePreviewChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

const DEVICES = { desktop: { label: "Computer", width: 1280 }, phone: { label: "Phone", width: 390 } } as const;
type Device = keyof typeof DEVICES;

/**
 * "Preview" button for admin pages: opens the live store page in a side
 * panel (an iframe of the real site), as on a computer or a phone. It reloads
 * by itself after every save on the page, so changes are easy to see.
 */
export function PreviewButton({ path, label = "Preview" }: { path: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)} aria-expanded={open}>
        <IconEye size={16} />
        {label}
      </button>
      {open && <PreviewPanel initialPath={path} onClose={() => setOpen(false)} />}
    </>
  );
}

function PreviewPanel({ initialPath, onClose }: { initialPath: string; onClose: () => void }) {
  const [path, setPath] = useState(initialPath);
  const [draft, setDraft] = useState(initialPath);
  const [device, setDevice] = useState<Device>("desktop");
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const reload = () => setVersion((n) => n + 1);
    window.addEventListener(EVENT, reload);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(EVENT, reload);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = DEVICES[device].width;
  const scale = box.w ? Math.min(1, box.w / width) : 1;
  // Cache-busting query so a reload after saving fetches the fresh page.
  const src = `${path}${path.includes("?") ? "&" : "?"}_preview=${version}`;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-page shadow-lg md:w-[min(64rem,62vw)]" role="dialog" aria-label="Store preview">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-3 py-2">
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const p = draft.trim();
            if (p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/admin")) {
              setPath(p);
              setLoading(true);
            }
          }}
        >
          <label htmlFor="preview-path" className="sr-only">
            Page to preview
          </label>
          <input id="preview-path" className="input h-9 min-h-9 min-w-0 flex-1 text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} />
        </form>
        <div className="flex rounded-md border border-line p-0.5" role="group" aria-label="Screen size">
          {(Object.keys(DEVICES) as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={device === d}
              onClick={() => setDevice(d)}
              className={cn("h-8 rounded px-2.5 text-sm", device === d ? "bg-brand text-white" : "text-text-2 hover:bg-muted")}
            >
              {DEVICES[d].label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Reload preview"
          title="Reload"
          onClick={() => {
            setVersion((n) => n + 1);
            setLoading(true);
          }}
        >
          <IconRefresh size={16} />
        </button>
        <a href={path} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon btn-sm" aria-label="Open in a new tab" title="Open in a new tab">
          <IconExternal size={16} />
        </a>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label="Close preview" onClick={onClose}>
          <IconClose size={18} />
        </button>
      </div>
      <div ref={boxRef} className="relative flex-1 overflow-hidden">
        {loading && <div className="skeleton absolute inset-3 rounded-lg" aria-hidden="true" />}
        {box.w > 0 && (
          <iframe
            key={`${src}-${device}`}
            title="Store preview"
            src={src}
            onLoad={() => setLoading(false)}
            className="absolute top-0 left-1/2 origin-top border-0 bg-white"
            style={{
              width,
              height: box.h / scale,
              transform: `translateX(-50%) scale(${scale})`,
            }}
          />
        )}
      </div>
    </div>
  );
}
