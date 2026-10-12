import { adminFormOptions } from "@/features/admin/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { BookForm } from "@/features/admin/components/book-form";

export const metadata = { title: "New book" };

export default async function NewBookPage() {
  const opts = await adminFormOptions();
  return (
    <>
      <AdminPageHead kicker="Books" title="New book" />
      <BookForm book={null} memberOf={[]} {...opts} />
    </>
  );
}
