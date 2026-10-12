"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconClose } from "@/components/icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  kicker?: string;
  children: ReactNode;
};

/**
 * Native <dialog>: focus trapping, Escape and inert background come from the
 * browser instead of a library. CSS turns it into a bottom sheet below 768px
 * (thumb reach) and a squared modal above.
 */
export function Sheet({ open, onClose, title, kicker, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // Stop the page behind from scrolling on iOS.
      document.documentElement.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={() => {
        document.documentElement.style.overflow = "";
        onClose();
      }}
      onClick={(e) => {
        // A click on the dialog box itself (not its content) is the backdrop.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="px-5 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-7 md:pt-6 md:pb-7">
        <div className="sheet-grip" aria-hidden="true" />
        <div className="mt-3 flex items-start justify-between gap-4 md:mt-0">
          <div>
            {kicker && <p className="label text-ink-3">{kicker}</p>}
            <h2 id={titleId} className="mt-1 text-title font-semibold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center hover:bg-paper-2"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
