import { hasDemoData } from "@/features/admin/demo/seed";
import { sweepOrphanFiles } from "@/features/admin/actions/tools";
import { DemoControls } from "@/features/admin/components/demo-controls";
import { AdminCard, AdminPageHead } from "@/features/admin/components/admin-page-head";
import { ToolButton } from "@/features/admin/components/tool-button";

export const metadata = { title: "Demo data and storage" };
// Generating covers, banners and PDFs takes a few seconds.
export const maxDuration = 60;

export default async function ToolsPage() {
  const loaded = await hasDemoData();
  return (
    <>
      <AdminPageHead title="Demo data and storage" />
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Demo data" description={loaded ? "Loaded" : "Not loaded"}>
          <p className="text-base text-text-2">
            Ten sample books with covers, previews and reviews, categories, three hero slides, three collections, five offers, 60 logged sales and 90
            days of analytics. Everything is marked as demo and can be removed in one go.
          </p>
          <DemoControls loaded={loaded} />
        </AdminCard>

        <AdminCard title="Storage check">
          <p className="text-base text-text-2">
            Saving and deleting already removes old files. This sweep deletes any image or PDF that nothing points to, for example after a browser
            crash mid-upload. Files from the last hour are skipped.
          </p>
          <div className="mt-4">
            <ToolButton label="Find and delete unused files" busyLabel="Checking storage…" action={sweepOrphanFiles} />
          </div>
        </AdminCard>
      </div>
    </>
  );
}
