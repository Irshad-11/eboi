"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import type { ActionResult } from "../action-result";
import { Notice } from "./notice";

/** A button that runs one server action, optionally behind a confirmation. */
export function ToolButton({
  label,
  busyLabel,
  action,
  confirm,
  tone = "outline",
}: {
  label: string;
  busyLabel: string;
  action: () => Promise<ActionResult>;
  confirm?: { title: string; body: string; cta: string };
  tone?: "outline" | "primary" | "danger";
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

  return (
    <div className="space-y-3">
      <button type="button" className={`btn btn-${tone}`} disabled={pending} onClick={() => (confirm ? setOpen(true) : run())} aria-busy={pending}>
        {pending ? busyLabel : label}
      </button>
      {result && <Notice tone={result.tone}>{result.text}</Notice>}
      {confirm && (
        <Sheet open={open} onClose={() => setOpen(false)} title={confirm.title} kicker="Please confirm">
          <p className="text-ink-2">{confirm.body}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className={tone === "danger" ? "btn btn-danger" : "btn btn-primary"} onClick={run}>
              {confirm.cta}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
