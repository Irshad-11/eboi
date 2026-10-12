"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { deleteDemoData, loadDemoData } from "../actions/tools";
import { Notice } from "./notice";

/**
 * Load / delete demo data. The result notice lives here, above the button
 * swap, so it stays visible after the page refreshes into the other state.
 */
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
        <button type="button" className="btn btn-danger" disabled={pending} onClick={() => setConfirm(true)}>
          {pending ? "Deleting demo data…" : "Delete all demo data"}
        </button>
      ) : (
        <button type="button" className="btn btn-primary" disabled={pending} onClick={() => run(loadDemoData)}>
          {pending ? "Generating covers and previews…" : "Load demo data"}
        </button>
      )}
      {pending && <p className="micro text-ink-3">This takes 10 to 30 seconds. Keep this tab open.</p>}
      {result && <Notice tone={result.tone}>{result.text}</Notice>}
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Delete all demo data?" kicker="Please confirm">
        <p className="text-ink-2">
          Removes every demo book, collection, offer, sale and analytics event, and deletes the demo covers and previews from storage. Your own books
          are not touched.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" className="btn btn-outline" onClick={() => setConfirm(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={() => run(deleteDemoData)}>
            Delete demo data
          </button>
        </div>
      </Sheet>
    </div>
  );
}
