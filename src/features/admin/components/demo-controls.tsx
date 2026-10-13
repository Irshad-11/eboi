"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { deleteDemoData, loadDemoData } from "../actions/tools";
import { Notice } from "./notice";

/** Load or delete demo data. The result stays visible after the page refreshes. */
export function DemoControls({ loaded }: { loaded: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const run = (action: typeof loadDemoData) =>
    start(async () => {
      setConfirm(false);
      setResult(null);
      const res = await action();
      setResult(res.ok ? { tone: "ok", text: res.message ?? "Done." } : { tone: "error", text: res.error });
      router.refresh();
    });

  return (
    <div className="mt-4 space-y-3">
      {loaded ? (
        <button type="button" className="btn btn-danger" data-loading={pending} disabled={pending} onClick={() => setConfirm(true)}>
          Delete all demo data
        </button>
      ) : (
        <button type="button" className="btn btn-primary" data-loading={pending} disabled={pending} onClick={() => run(loadDemoData)}>
          Load demo data
        </button>
      )}
      {pending && <p className="text-sm text-text-3">This takes 10 to 30 seconds.</p>}
      {result && <Notice tone={result.tone}>{result.text}</Notice>}
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete all demo data?"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger-solid" onClick={() => run(deleteDemoData)}>
              Delete demo data
            </button>
          </div>
        }
      >
        <p className="text-base text-text-2">
          Removes every demo book, category, collection, offer, banner, review, sale and analytics event, and deletes their files from storage. Your own data is not touched.
        </p>
      </Dialog>
    </div>
  );
}
