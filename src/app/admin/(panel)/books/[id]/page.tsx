import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { adminFormOptions, adminGetBook } from "@/features/admin/queries";
import { deleteBook } from "@/features/admin/actions/books";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { BookForm } from "@/features/admin/components/book-form";
import { DeleteButton } from "@/features/admin/components/delete-button";
import { IconChart, IconDownload } from "@/components/icons";

export const metadata = { title: "Edit book" };

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [found, opts] = await Promise.all([adminGetBook(id), adminFormOptions()]);
  if (!found) notFound();
  const { book, memberOf, reviews } = found;

  return (
    <>
      <AdminPageHead
        title={book.title}
        back={{ href: "/admin/books", label: "Books" }}
        meta={`${book.book_code} · ${book.status === "published" ? "Published" : "Draft"}${book.is_demo ? " · Demo" : ""}`}
        actions={
          <>
            <Link href={`/admin/books/${book.id}/analytics`} className="btn btn-secondary btn-sm">
              <IconChart size={16} /> Analytics
            </Link>
            <a href={`/api/admin/export?id=${book.id}`} className="btn btn-secondary btn-sm">
              <IconDownload size={16} /> Export JSON
            </a>
            <DeleteButton
              label={`“${book.title}”`}
              consequence="The book, its cover, preview and images are deleted. Logged sales keep their title and price. Old links will show the not found page."
              action={deleteBook.bind(null, book.id)}
              redirectTo="/admin/books"
            />
          </>
        }
      />
      <BookForm book={book} memberOf={memberOf} reviews={reviews} {...opts} />
    </>
  );
}
