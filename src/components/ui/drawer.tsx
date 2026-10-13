"use client";

import { useId, useRef, type ReactNode } from "react";
import { IconClose } from "@/components/icons";
import { useModalState } from "./dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Left drawer for the mobile menu and mobile filters. */
export function Drawer({ open, onClose, title, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useModalState(ref, open);

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 id={titleId} className="text-md font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon btn-sm" aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </dialog>
  );
}
