/**
 * Turns a title into a URL slug. Bangla titles have no Latin letters, so they
 * fall back to the book code; the admin can always type a slug by hand.
 */
export function slugify(input: string, fallback = "book"): string {
  const s = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return s || fallback;
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
