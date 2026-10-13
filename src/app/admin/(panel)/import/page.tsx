import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { ImportPanel } from "@/features/admin/components/import-panel";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata = { title: "Import / export" };

export default async function ImportPage() {
  const supabase = await createSessionClient();
  const [{ data: collections }, { data: categories }] = await Promise.all([
    supabase.from("collections").select("slug, name").order("sort_order").order("name"),
    supabase.from("categories").select("name").order("sort_order").order("name"),
  ]);
  return (
    <>
      <AdminPageHead title="Import and export" meta="Add or update books from JSON, build a JSON with a form, or download a backup" />
      <ImportPanel collections={collections ?? []} categories={(categories ?? []).map((c) => c.name)} />
    </>
  );
}
