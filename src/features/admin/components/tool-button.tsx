"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import type { ActionResult } from "../action-result";
import { Notice } from "./notice";

/** Runs one server action, optionally behind a confirmation. */
export function ToolButton({
  label,
  action,
  confirm,
  tone = "secondary",
}: {
  label: string;
  busyLabel?: string;
  action: () => Promise<ActionResult>;
  confirm?: { title: string; body: string; cta: string };
  tone?: "secondary" | "primary" | "danger";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const run = () =>
    start(async () => {
      setOpen(false);
      const res = await action();
      setResult(res.ok ? { tone: "ok", text: res.message ?? "Done." } : { tone: "error", text: res.error });
      router.refresh();
    });
  const cls = tone === "danger" ? "btn btn-danger" : tone === "primary" ? "btn btn-primary" : "btn btn-secondary";

  return (
    <div className="space-y-3">
      <button type="button" className={cls} data-loading={pending} disabled={pending} onClick={() => (confirm ? setOpen(true) : run())}>
        {label}
      </button>
      {result && <Notice tone={result.tone}>{result.text}</Notice>}
      {confirm && (
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title={confirm.title}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className={tone === "danger" ? "btn btn-danger-solid" : "btn btn-primary"} onClick={run}>
                {confirm.cta}
              </button>
            </div>
          }
        >
          <p className="text-base text-text-2">{confirm.body}</p>
        </Dialog>
      )}
    </div>
  );
}
