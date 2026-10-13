import { adminFormOptions } from "@/features/admin/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { BookForm } from "@/features/admin/components/book-form";

export const metadata = { title: "Add book" };

export default async function NewBookPage() {
  const opts = await adminFormOptions();
  return (
    <>
      <AdminPageHead title="Add book" back={{ href: "/admin/books", label: "Books" }} />
      <BookForm book={null} memberOf={[]} reviews={[]} {...opts} />
    </>
  );
}
