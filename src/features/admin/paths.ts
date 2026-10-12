import { COVER } from "@/config/limits";

/**
 * Storage layout: <bucket>/<book id>/<random>.<ext>.
 * A new random name on every upload means the public cover URL changes when
 * the file changes, so caches can never serve an old cover.
 */
export function newObjectPath(bookId: string, ext: string): string {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${bookId}/${Date.now().toString(36)}-${rand}.${ext}`;
}

export function coverExtension(mime: string): string | null {
  return (COVER.extensions as Record<string, string>)[mime] ?? null;
}

/** Paths must live in the book's own folder: a form cannot point at another book's file. */
export function belongsToBook(path: string, bookId: string): boolean {
  return path.startsWith(`${bookId}/`) && !path.includes("..") && /^[0-9a-f-]{36}\/[a-z0-9-]+\.(jpg|png|pdf)$/.test(path);
}
