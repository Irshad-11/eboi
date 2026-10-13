import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { ImportPanel } from "@/features/admin/components/import-panel";

export const metadata = { title: "Import / export" };

export default function ImportPage() {
  return (
    <>
      <AdminPageHead title="Import and export" meta="Add or update books from JSON, or download a backup" />
      <ImportPanel />
    </>
  );
}
