"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconClose } from "@/components/icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
  className?: string;
};

/**
 * Native <dialog>: focus trap, Escape and inert background come from the
 * browser. Centered on desktop; full width, anchored to the bottom, on phones.
 */
export function Dialog({ open, onClose, title, children, footer, size = "md", className }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useModalState(ref, open);

  return (
    <dialog
      ref={ref}
      className={cn("dialog", size === "lg" && "dialog-lg", className)}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 id={titleId} className="text-md font-semibold">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="btn btn-ghost btn-icon btn-sm -mr-1.5" aria-label="Close">
          <IconClose size={18} />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer && <div className="border-t border-line px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">{footer}</div>}
    </dialog>
  );
}

/** Shared open/close + page scroll lock for dialogs and drawers. */
export function useModalState(ref: React.RefObject<HTMLDialogElement | null>, open: boolean) {
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
    if (!open) document.documentElement.style.overflow = "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open, ref]);
}
