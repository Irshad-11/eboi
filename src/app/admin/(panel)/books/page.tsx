import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatDate, formatCompact } from "@/lib/format";
import { coverUrl } from "@/features/books/cover";
import { adminListBooks } from "@/features/admin/queries";
import { deleteBook } from "@/features/admin/actions/books";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { DeleteButton } from "@/features/admin/components/delete-button";
import { IconDownload, IconPlus } from "@/components/icons";

export const metadata = { title: "Books" };

type Props = { searchParams: Promise<{ q?: string; status?: string }> };

export default async function AdminBooksPage({ searchParams }: Props) {
  const { q = "", status = "" } = await searchParams;
  const all = await adminListBooks();
  const needle = q.trim().toLowerCase();
  const books = all.filter(
    (b) =>
      (!status || b.status === status) &&
      (!needle || [b.title, b.author, b.book_code, b.slug].join(" ").toLowerCase().includes(needle)),
  );
  const drafts = all.filter((b) => b.status === "draft").length;

  return (
    <>
      <AdminPageHead
        kicker={`${all.length} books · ${drafts} drafts`}
        title="Books"
        actions={
          <>
            <a href="/api/admin/export" className="btn btn-outline btn-sm">
              <IconDownload size={18} /> Export all
            </a>
            <Link href="/admin/books/new" className="btn btn-primary btn-sm">
              <IconPlus size={18} /> New book
            </Link>
          </>
        }
      />

      <form className="mb-6 flex flex-wrap gap-3" role="search">
        <label htmlFor="q" className="sr-only">
          Search
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Title, author or EB-0001" className="input max-w-xs" />
        <label htmlFor="status" className="sr-only">
          Status
        </label>
        <select id="status" name="status" defaultValue={status} className="select max-w-[12rem]">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <button className="btn btn-outline btn-sm">Filter</button>
      </form>

      {books.length === 0 ? (
        <p className="text-ink-2">
          No books yet. <Link href="/admin/books/new" className="link">Add the first one</Link> or load demo data from{" "}
          <Link href="/admin/tools" className="link">Demo data</Link>.
        </p>
      ) : (
        <ul className="border-t-[3px] border-ink">
          {books.map((b) => {
            const cover = coverUrl(b);
            return (
              <li key={b.id} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-ink py-3 md:grid-cols-[3rem_minmax(0,2fr)_6rem_6rem_8rem_auto] md:gap-5">
                <div className="cover w-12">{/* unoptimized: drafts are admin-only, and the optimizer would fetch without the admin's cookie. */}
                  {cover && <Image src={cover} alt="" fill sizes="48px" unoptimized />}</div>
                <div className="min-w-0">
                  <Link href={`/admin/books/${b.id}`} className="line-clamp-1 font-semibold hover:underline">
                    {b.title}
                  </Link>
                  <p className="micro mt-1 flex flex-wrap gap-x-2 text-ink-3">
                    <span className="text-ink">{b.book_code}</span>
                    <span className={b.status === "published" ? "text-green-700" : "text-ochre-ink"}>{b.status}</span>
                    {b.is_demo && <span>demo</span>}
                    {!b.preview_path && <span>no preview</span>}
                    <span className="md:hidden">{formatPrice(b.price)}</span>
                  </p>
                </div>
                <span className="price hidden text-small md:block">{formatPrice(b.price)}</span>
                <span className="micro hidden text-ink-2 md:block">
                  {formatCompact(b.total_sells)} sold
                  <br />
                  {formatCompact(b.views)} views
                </span>
                <span className="micro hidden text-ink-3 md:block">{formatDate(b.updated_at)}</span>
                <div className="flex items-center">
                  <Link href={`/admin/books/${b.id}/analytics`} className="btn btn-quiet btn-sm hidden sm:inline-flex">
                    Stats
                  </Link>
                  <DeleteButton
                    compact
                    label={`“${b.title}”`}
                    consequence="The book, its cover and its preview file are deleted from Supabase. Logged sales keep their title and price snapshot."
                    action={deleteBook.bind(null, b.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
