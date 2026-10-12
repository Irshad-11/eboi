import { formatDate } from "@/lib/format";
import type { BookDetail } from "@/features/books/types";

/** Book facts as a colophon with dotted leaders, like the last page of a printed book. */
export function Colophon({ book }: { book: BookDetail }) {
  const rows: [string, string | null][] = [
    ["Book ID", book.book_code],
    ["Pages", book.page_count ? String(book.page_count) : null],
    ["Language", book.language],
    ["Format", book.format],
    ["File size", book.file_size],
    ["Released", book.release_date ? formatDate(book.release_date) : null],
    ["Free preview", book.preview_page_count ? `${book.preview_page_count} pages` : book.preview_path ? "Yes" : null],
    ["Category", book.category],
  ];
  return (
    <dl className="space-y-2.5">
      {rows
        .filter((r): r is [string, string] => Boolean(r[1]))
        .map(([k, v]) => (
          <div key={k} className="leader-row">
            <dt className="label text-ink-2">{k}</dt>
            <dd className={k === "Book ID" ? "font-mono font-semibold" : "font-semibold"}>{v}</dd>
          </div>
        ))}
    </dl>
  );
}
