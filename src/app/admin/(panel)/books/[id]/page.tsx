import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { adminFormOptions, adminGetBook } from "@/features/admin/queries";
import { deleteBook } from "@/features/admin/actions/books";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { BookForm } from "@/features/admin/components/book-form";
import { DeleteButton } from "@/features/admin/components/delete-button";
import { IconDownload } from "@/components/icons";

export const metadata = { title: "Edit book" };

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [found, opts] = await Promise.all([adminGetBook(id), adminFormOptions()]);
  if (!found) notFound();
  const { book, memberOf } = found;

  return (
    <>
      <AdminPageHead
        kicker={`${book.book_code} · ${book.status}${book.is_demo ? " · demo" : ""}`}
        title={book.title}
        actions={
          <>
            <Link href={`/admin/books/${book.id}/analytics`} className="btn btn-outline btn-sm">
              Analytics
            </Link>
            <a href={`/api/admin/export?id=${book.id}`} className="btn btn-outline btn-sm">
              <IconDownload size={18} /> JSON
            </a>
            <DeleteButton
              label={`“${book.title}”`}
              consequence="The book, its cover and its preview file are deleted from Supabase. Logged sales keep their title and price snapshot. Old links will show the 404 page."
              action={deleteBook.bind(null, book.id)}
              redirectTo="/admin/books"
            />
          </>
        }
      />
      <BookForm book={book} memberOf={memberOf} {...opts} />
    </>
  );
}
