# Book JSON format (version 1)

Used by **Admin → Import / export**. The same format comes out of every export,
so the easiest way to make a new file is to export an existing book and edit it.

- Machine-readable schema: [`book-import.schema.json`](./book-import.schema.json)
  (also served at `/book-import.schema.json`, so editors like VS Code validate
  the file when it starts with `"$schema"`).
- Sample: [`sample-book.json`](./sample-book.json) (also at `/sample-book.json`).

## How an import works

1. Pick the JSON file. The server checks it and tells you whether it will
   **create** a new book or **update** an existing one:
   - if `book_code` is given and exists → that book is updated;
   - else if `slug` exists → that book is updated;
   - else → a new book is created (with `book_code` if you gave one, otherwise
     the next free `EB-xxxx`).
2. Optionally pick the cover (JPG/PNG, 2:3, ≥600px wide, ≤2 MB) and the
   preview PDF (first 5 to 10 pages, max 12 pages, ≤6 MB). They upload
   straight to the private buckets.
3. Press **Import this book**. The server re-checks the files byte by byte,
   saves the book, sets its collections, and deletes any file it replaced.
   If anything fails, the files it just uploaded are deleted again.

**Bulk:** a JSON *array* of books imports metadata for all of them in one go
(no files). Existing covers and previews are kept. "Export all" produces such
an array, which doubles as a backup.

## Fields

| Field | Required | Notes |
|---|---|---|
| `slug` | yes | `lowercase-with-dashes`. The permanent link `/books/<slug>`. |
| `title` | yes | Up to 160 characters. Bangla is fine. |
| `price` | yes | Taka, whole numbers recommended. |
| `book_code` | no | `EB-0001` style. See matching rules above. |
| `subtitle`, `author`, `category`, `language` | no | `category` and `language` power the shop filters. |
| `tags` | no | Up to 12. Used by search and "related books". |
| `page_count`, `file_size`, `format` | no | Facts about the **full** PDF, shown in the colophon. |
| `description`, `table_of_contents` | no | Plain text. Blank line = new paragraph. |
| `highlights` | no | "What you get" bullets, up to 12. |
| `old_price` | no | Manual struck-through price (must be higher than `price`). Ignored while an offer is running. |
| `offer_id` | no | Pins an offer to this book. Normally `null`. |
| `rating`, `rating_count`, `total_sells`, `views` | no | **Display** values shown publicly. Real numbers are tracked separately in Analytics. Only use real ratings: they are sent to Google as structured data. |
| `release_date` | no | `YYYY-MM-DD`. Decides "Latest" order. |
| `status` | no | `draft` (default, hidden) or `published`. |
| `badge` | no | `none`, `new`, `bestseller`. |
| `is_featured` | no | Shows the book in "Also on the front page". |
| `seo_title`, `seo_description` | no | 70 / 170 characters. |
| `internal_file_note` | no | Private reminder of where the full PDF lives on your computer. Never sent to visitors (blocked at database level). |
| `collections` | no | Collection **slugs**. Replaces the book's collections. Unknown slugs are skipped and listed. |
| `files.cover`, `files.preview` | no | Informational file names. The importer warns if the files you pick have different names. |

The full PDF is never part of an import. It stays on your computer and is
sent manually on WhatsApp.
