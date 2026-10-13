"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheck, IconCopy } from "@/components/icons";
import { copyText } from "@/features/whatsapp/copy";

/**
 * The Book ID with one-tap copy. Copying stamps a big "Copied" over a blurred
 * page for a moment, so it is obvious the ID is ready to paste in WhatsApp.
 */
export function BookIdChip({ code }: { code: string }) {
  const [stamp, setStamp] = useState<"in" | "out" | null>(null);

  useEffect(() => {
    if (!stamp) return;
    const t = setTimeout(() => setStamp(stamp === "in" ? "out" : null), stamp === "in" ? 1100 : 300);
    return () => clearTimeout(t);
  }, [stamp]);

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (await copyText(code)) setStamp("in");
        }}
        className="group inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-2 bg-white py-1 pr-2 pl-3 text-sm text-text-2 transition-colors hover:border-brand hover:text-brand"
        aria-label={`Copy Book ID ${code}`}
      >
        <span className="text-text-3 group-hover:text-brand">Book ID</span>
        <span className="font-semibold text-text tnum group-hover:text-brand">{code}</span>
        {stamp ? <IconCheck size={15} className="text-brand" /> : <IconCopy size={15} />}
      </button>
      <span className="sr-only" aria-live="polite">
        {stamp ? `Book ID ${code} copied` : ""}
      </span>
      {stamp &&
        createPortal(
          <div className="copy-stamp-layer" data-state={stamp} aria-hidden="true">
            <div className="copy-stamp">
              <span className="flex items-center gap-2 text-2xl font-extrabold md:text-3xl">
                <IconCheck size={28} />
                Copied
              </span>
              <span className="mt-0.5 text-base font-semibold tnum">{code}</span>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
