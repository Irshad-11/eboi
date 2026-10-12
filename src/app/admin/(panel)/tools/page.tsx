import { hasDemoData } from "@/features/admin/demo/seed";
import { sweepOrphanFiles } from "@/features/admin/actions/tools";
import { DemoControls } from "@/features/admin/components/demo-controls";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { ToolButton } from "@/features/admin/components/tool-button";

export const metadata = { title: "Demo data and storage" };
// Generating covers and PDFs takes a few seconds.
export const maxDuration = 60;

export default async function ToolsPage() {
  const loaded = await hasDemoData();
  return (
    <>
      <AdminPageHead kicker="Housekeeping" title="Demo data and storage" />
      <div className="grid gap-12 lg:grid-cols-2">
        <section className="border-t-[3px] border-ink pt-4" aria-labelledby="demo-title">
          <h2 id="demo-title" className="text-title font-semibold">
            Demo data
          </h2>
          <p className="mt-2 text-ink-2">
            Ten invented books (two of them drafts) with typeset covers and preview PDFs, three collections in all three moods, five offers (live,
            scheduled, inactive), 60 logged sales and 90 days of analytics. Everything is marked DEMO.
          </p>
          <p className="micro mt-4 text-ink-3">Status: {loaded ? "loaded" : "not loaded"}</p>
          <DemoControls loaded={loaded} />
        </section>

        <section className="border-t-[3px] border-ink pt-4" aria-labelledby="sweep-title">
          <h2 id="sweep-title" className="text-title font-semibold">
            Storage check
          </h2>
          <p className="mt-2 text-ink-2">
            Saving, replacing and deleting books already removes old files. This sweep is the safety net: it deletes any cover or preview file that
            no book points to (for example after a browser crash mid-upload). Files from the last hour are skipped.
          </p>
          <div className="mt-4">
            <ToolButton label="Find and delete orphan files" busyLabel="Checking storage…" action={sweepOrphanFiles} />
          </div>
        </section>
      </div>
    </>
  );
}
