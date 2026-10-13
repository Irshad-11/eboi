"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { IconTrash } from "@/components/icons";
import type { ActionResult } from "../action-result";

type Props = {
  label: string;
  consequence: string;
  action: () => Promise<ActionResult>;
  redirectTo?: string;
  compact?: boolean;
};

/** Every destructive action goes through a confirmation dialog. */
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
        className={compact ? "btn btn-ghost btn-icon btn-sm text-sale hover:bg-sale-soft hover:text-sale" : "btn btn-danger btn-sm"}
        aria-label={compact ? `Delete ${label}` : undefined}
        title={compact ? `Delete ${label}` : undefined}
      >
        <IconTrash size={16} />
        {!compact && "Delete"}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Delete ${label}?`}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger-solid"
              data-loading={pending}
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
              Delete
            </button>
          </div>
        }
      >
        <p className="text-base text-text-2">{consequence}</p>
        {error && <p className="field-error">{error}</p>}
      </Dialog>
    </>
  );
}
