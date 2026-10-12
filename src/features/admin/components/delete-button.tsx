"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { IconTrash } from "@/components/icons";
import type { ActionResult } from "../action-result";

type Props = {
  /** What is being deleted, in a few words, e.g. "“Freelance Taka”". */
  label: string;
  /** Plain-language consequences shown in the confirmation. */
  consequence: string;
  action: () => Promise<ActionResult>;
  redirectTo?: string;
  compact?: boolean;
};

/** Every destructive action goes through a confirmation sheet. */
export function DeleteButton({ label, consequence, action, redirectTo, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={compact ? "inline-flex size-11 items-center justify-center text-rust hover:bg-rust-wash" : "btn btn-outline btn-sm border-rust text-rust"}
        aria-label={compact ? `Delete ${label}` : undefined}
      >
        <IconTrash size={18} />
        {!compact && "Delete"}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Delete ${label}?`} kicker="Cannot be undone">
        <p className="text-ink-2">{consequence}</p>
        {error && <p className="field-error">{error}</p>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
            Keep it
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await action();
                if (!res.ok) return setError(res.error);
                setOpen(false);
                if (redirectTo) router.replace(redirectTo);
                router.refresh();
              })
            }
          >
            {pending ? "Deleting…" : "Delete for good"}
          </button>
        </div>
      </Sheet>
    </>
  );
}
