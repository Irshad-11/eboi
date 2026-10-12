import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { ImportPanel } from "@/features/admin/components/import-panel";

export const metadata = { title: "Import / export" };

export default function ImportPage() {
  return (
    <>
      <AdminPageHead kicker="Books" title="Import and export" />
      <ImportPanel />
    </>
  );
}
