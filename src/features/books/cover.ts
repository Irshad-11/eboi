/**
 * Public cover URL. Covers live in a private bucket and are streamed by
 * /api/cover/[id]. The `v` part changes whenever the file is replaced (new
 * files get new random names), so the response can be cached for a year.
 */
export function coverUrl(book: { id: string; cover_path: string | null }): string | null {
  if (!book.cover_path) return null;
  // A pasted cover link is used as it is.
  if (/^https?:\/\//i.test(book.cover_path)) return book.cover_path;
  const file = book.cover_path.split("/").pop() ?? "";
  const v = file.replace(/\.[a-z0-9]+$/i, "").slice(-16) || "1";
  return `/api/cover/${book.id}?v=${encodeURIComponent(v)}`;
}
