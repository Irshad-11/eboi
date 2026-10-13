import Link from "next/link";
import { formatPrice, formatDate, formatCompact } from "@/lib/format";
import { coverUrl } from "@/features/books/cover";
import { adminListBooks } from "@/features/admin/queries";
import { deleteBook } from "@/features/admin/actions/books";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { DeleteButton } from "@/features/admin/components/delete-button";
import { IconChart, IconDownload, IconEdit, IconPlus, IconSearch } from "@/components/icons";
import { isFreeNow } from "@/features/offers/pricing";

export const metadata = { title: "Books" };

type Props = { searchParams: Promise<{ q?: string; status?: string }> };

export default async function AdminBooksPage({ searchParams }: Props) {
  const { q = "", status = "" } = await searchParams;
  const all = await adminListBooks();
  const needle = q.trim().toLowerCase();
  const books = all.filter((b) => (!status || b.status === status) && (!needle || [b.title, b.author, b.book_code, b.slug].join(" ").toLowerCase().includes(needle)));
  const drafts = all.filter((b) => b.status === "draft").length;

  return (
    <>
      <AdminPageHead
        title="Books"
        meta={`${all.length} books · ${drafts} drafts`}
        actions={
          <>
            <a href="/api/admin/export" className="btn btn-secondary">
              <IconDownload size={18} /> Export
            </a>
            <Link href="/admin/books/new" className="btn btn-primary">
              <IconPlus size={18} /> Add book
            </Link>
          </>
        }
      />

      <div className="rounded-lg border border-line bg-white">
        <form className="flex flex-wrap gap-2 border-b border-line p-3" role="search">
          <div className="relative min-w-0 basis-full sm:basis-0 sm:flex-1">
            <label htmlFor="q" className="sr-only">
              Search books
            </label>
            <IconSearch size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-3" />
            <input id="q" name="q" defaultValue={q} placeholder="Title, author or Book ID" className="input pl-9" />
          </div>
          <label htmlFor="status" className="sr-only">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="select min-w-0 flex-1 sm:w-40 sm:flex-none">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <button className="btn btn-secondary">Filter</button>
        </form>

        {books.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-base text-text-2">No books found.</p>
            <Link href="/admin/books/new" className="btn btn-primary mt-3">
              Add book
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {books.map((b) => {
              const cover = coverUrl(b);
              return (
                <li key={b.id} className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 md:grid-cols-[2.75rem_minmax(0,1fr)_6rem_7rem_7rem_auto] md:gap-4 md:px-4">
                  <div className="cover-frame w-11">
                    {/* Plain img: drafts are admin-only and the image optimizer cannot fetch them. */}
                    {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
                    {cover && <img src={cover} alt="" />}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/books/${b.id}`} className="line-clamp-1 text-base font-semibold hover:text-brand">
                      {b.title}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-3">
                      <span>{b.book_code}</span>
                      <span className={`badge ${b.status === "published" ? "badge-ok" : "badge-soft"}`}>{b.status === "published" ? "Published" : "Draft"}</span>
                      {!b.preview_path && <span className="badge badge-warn">No preview</span>}
                      {isFreeNow(b) && <span className="badge badge-free">{b.free_until ? `Free until ${formatDate(b.free_until)}` : "Free"}</span>}
                      {b.is_demo && <span className="badge badge-soft">Demo</span>}
                      <span className="md:hidden">{formatPrice(Number(b.price))}</span>
                    </p>
                  </div>
                  <span className="hidden text-base font-semibold md:block tnum">{formatPrice(Number(b.price))}</span>
                  <span className="hidden text-sm text-text-3 md:block">
                    {formatCompact(b.total_sells)} sold · {formatCompact(b.views)} views
                  </span>
                  <span className="hidden text-sm text-text-3 md:block">{formatDate(b.updated_at)}</span>
                  <div className="flex items-center">
                    <Link href={`/admin/books/${b.id}`} className="btn btn-ghost btn-icon btn-sm" aria-label={`Edit ${b.title}`} title="Edit">
                      <IconEdit size={16} />
                    </Link>
                    <Link href={`/admin/books/${b.id}/analytics`} className="btn btn-ghost btn-icon btn-sm hidden sm:inline-flex" aria-label={`Analytics for ${b.title}`} title="Analytics">
                      <IconChart size={16} />
                    </Link>
                    <DeleteButton compact label={`“${b.title}”`} consequence="The book, its cover, preview and images are deleted. Logged sales keep their title and price." action={deleteBook.bind(null, b.id)} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
