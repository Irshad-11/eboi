"use client";

import { COVER, PREVIEW } from "@/config/limits";
import { BUCKETS, type BucketName } from "@/config/storage";
import { getBrowserClient } from "@/lib/supabase/browser";
import { coverExtension, newObjectPath } from "./paths";

/**
 * Browser-side checks and uploads. The server re-checks every file after
 * upload (never trust the browser); these exist to fail fast with a clear
 * message before any bytes are sent.
 */

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

export type CoverCheck = { ok: true; warning?: string } | { ok: false; error: string };

export async function checkCover(file: File): Promise<CoverCheck> {
  if (!(COVER.mimeTypes as readonly string[]).includes(file.type)) return { ok: false, error: "Cover must be a JPG or PNG." };
  if (file.size > COVER.maxBytes) return { ok: false, error: `Cover is ${mb(file.size)}. The limit is ${mb(COVER.maxBytes)}.` };
  const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
  if (!dims) return { ok: false, error: "That image could not be read." };
  if (dims.w < COVER.minWidth) return { ok: false, error: `Cover is ${dims.w}px wide. Use at least ${COVER.minWidth}px.` };
  const ratio = dims.w / dims.h;
  if (Math.abs(ratio - COVER.aspect) / COVER.aspect > 0.08) {
    return { ok: true, warning: `This cover is ${dims.w}×${dims.h}. Covers are shown at 2:3, so the edges will be cropped.` };
  }
  return { ok: true };
}

export type PreviewCheck = { ok: true; pages: number } | { ok: false; error: string };

export async function checkPreview(file: File): Promise<PreviewCheck> {
  if (file.type !== PREVIEW.mimeType && !file.name.toLowerCase().endsWith(".pdf")) return { ok: false, error: "Preview must be a PDF." };
  if (file.size > PREVIEW.maxBytes) {
    return { ok: false, error: `Preview is ${mb(file.size)}. The limit is ${mb(PREVIEW.maxBytes)}. Export only the first pages, with compressed images.` };
  }
  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
    const pages = doc.getPageCount();
    if (pages > PREVIEW.maxPages) {
      return { ok: false, error: `This PDF has ${pages} pages. A preview should be ${PREVIEW.recommended} (maximum ${PREVIEW.maxPages}). Never upload the full book.` };
    }
    return { ok: true, pages };
  } catch {
    return { ok: false, error: "That PDF could not be opened. Is it damaged or password protected?" };
  }
}

export async function uploadToBucket(bucket: BucketName, path: string, file: File): Promise<void> {
  const { error } = await getBrowserClient()
    .storage.from(bucket)
    .upload(path, file, { contentType: file.type || "application/pdf", upsert: false, cacheControl: "31536000" });
  if (error) throw new Error(`Upload failed: ${error.message}`);
}

/** Uploads a checked cover/preview into the book's folder and returns the new path. */
export async function uploadCover(bookId: string, file: File): Promise<string> {
  const path = newObjectPath(bookId, coverExtension(file.type) ?? "jpg");
  await uploadToBucket(BUCKETS.covers, path, file);
  return path;
}

export async function uploadPreview(bookId: string, file: File): Promise<string> {
  const path = newObjectPath(bookId, "pdf");
  await uploadToBucket(BUCKETS.previews, path, file);
  return path;
}
