import { COVER, MEDIA } from "@/config/limits";
import type { MediaFolder } from "@/config/storage";

function rand(): string {
  const r = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${r}`;
}

/**
 * Book files: <bucket>/<book id>/<random>.<ext>. A new random name on every
 * upload means public URLs change when a file changes, so caches can never
 * serve an old file.
 */
export function newObjectPath(bookId: string, ext: string): string {
  return `${bookId}/${rand()}.${ext}`;
}

/** Media files: media/<folder>/<owner id>/<random>.<ext> */
export function newMediaPath(folder: MediaFolder, ownerId: string, ext: string): string {
  return `${folder}/${ownerId}/${rand()}.${ext}`;
}

export function coverExtension(mime: string): string | null {
  return (COVER.extensions as Record<string, string>)[mime] ?? null;
}

export function mediaExtension(mime: string): string | null {
  return (MEDIA.extensions as Record<string, string>)[mime] ?? null;
}

/** Paths must live in the book's own folder: a form cannot point at another book's file. */
export function belongsToBook(path: string, bookId: string): boolean {
  return path.startsWith(`${bookId}/`) && !path.includes("..") && /^[0-9a-f-]{36}\/[a-z0-9-]+\.(jpg|png|pdf)$/.test(path);
}

export function belongsToMedia(path: string, folder: MediaFolder, ownerId: string): boolean {
  return path.startsWith(`${folder}/${ownerId}/`) && !path.includes("..") && /^[a-z]+\/[0-9a-f-]{36}\/[a-z0-9-]+\.(jpg|png|webp)$/.test(path);
}
