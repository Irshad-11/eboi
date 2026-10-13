"use client";

import { COVER, MEDIA, PREVIEW, THUMBS } from "@/config/limits";
import { BUCKETS, MEDIA_FOLDERS, type BucketName, type MediaFolder } from "@/config/storage";
import { getBrowserClient } from "@/lib/supabase/browser";
import { coverExtension, mediaExtension, newMediaPath, newObjectPath } from "./paths";

/**
 * Browser-side checks and uploads. The server re-checks every file after
 * upload; these exist to fail fast with a clear message.
 */

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

function imageSize(file: File): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
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
}

export type CoverCheck = { ok: true; warning?: string } | { ok: false; error: string };

export async function checkCover(file: File): Promise<CoverCheck> {
  if (!(COVER.mimeTypes as readonly string[]).includes(file.type)) return { ok: false, error: "Cover must be a JPG, PNG, WebP or GIF." };
  if (file.size > COVER.maxBytes) return { ok: false, error: `Cover is ${mb(file.size)}. The limit is ${mb(COVER.maxBytes)}.` };
  const dims = await imageSize(file);
  if (!dims) return { ok: false, error: "That image could not be read." };
  if (dims.w < COVER.minWidth) return { ok: false, error: `Cover is ${dims.w}px wide. Use at least ${COVER.minWidth}px.` };
  if (Math.abs(dims.w / dims.h - COVER.aspect) / COVER.aspect > 0.08) {
    return { ok: true, warning: `This cover is ${dims.w}×${dims.h}. Covers show at 2:3, so edges will be cropped.` };
  }
  return { ok: true };
}

export type PreviewCheck = { ok: true; pages: number } | { ok: false; error: string };

export async function checkPreview(file: File): Promise<PreviewCheck> {
  if (file.type !== PREVIEW.mimeType && !file.name.toLowerCase().endsWith(".pdf")) return { ok: false, error: "Preview must be a PDF." };
  if (file.size > PREVIEW.maxBytes) {
    return { ok: false, error: `Preview is ${mb(file.size)}. The limit is ${mb(PREVIEW.maxBytes)}. Export only the first pages.` };
  }
  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
    const pages = doc.getPageCount();
    if (pages > PREVIEW.maxPages) {
      return { ok: false, error: `This PDF has ${pages} pages. A preview should be ${PREVIEW.recommended} (maximum ${PREVIEW.maxPages}).` };
    }
    return { ok: true, pages };
  } catch {
    return { ok: false, error: "That PDF could not be opened. Is it damaged or password protected?" };
  }
}

export async function checkMediaImage(file: File): Promise<string | null> {
  if (!(MEDIA.mimeTypes as readonly string[]).includes(file.type)) return "Use a JPG, PNG, WebP or GIF image.";
  if (file.size > MEDIA.maxBytes) return `Image is ${mb(file.size)}. The limit is ${mb(MEDIA.maxBytes)}.`;
  if (!(await imageSize(file))) return "That image could not be read.";
  return null;
}

export async function uploadToBucket(bucket: BucketName, path: string, file: Blob, contentType: string): Promise<void> {
  const { error } = await getBrowserClient().storage.from(bucket).upload(path, file, { contentType, upsert: false, cacheControl: "31536000" });
  if (error) throw new Error(`Upload failed: ${error.message}`);
}

export async function uploadCover(bookId: string, file: File): Promise<string> {
  const path = newObjectPath(bookId, coverExtension(file.type) ?? "jpg");
  await uploadToBucket(BUCKETS.covers, path, file, file.type);
  return path;
}

export async function uploadPreview(bookId: string, file: File): Promise<string> {
  const path = newObjectPath(bookId, "pdf");
  await uploadToBucket(BUCKETS.previews, path, file, "application/pdf");
  return path;
}

export async function uploadMedia(folder: MediaFolder, ownerId: string, file: File): Promise<string> {
  const path = newMediaPath(folder, ownerId, mediaExtension(file.type) ?? "jpg");
  await uploadToBucket(BUCKETS.media, path, file, file.type);
  return path;
}

/**
 * Renders the first pages of a preview PDF to small JPEGs in the browser
 * and uploads them, for the thumbnails on the book page.
 */
export async function makePreviewThumbs(bookId: string, file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${pdfjs.version}`;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const paths: string[] = [];
  try {
    for (let n = 1; n <= Math.min(THUMBS.count, doc.numPages); n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: THUMBS.width / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
      if (!blob) continue;
      const path = newMediaPath(MEDIA_FOLDERS.thumbs, bookId, "jpg");
      await uploadToBucket(BUCKETS.media, path, blob, "image/jpeg");
      paths.push(path);
    }
  } finally {
    await task.destroy();
  }
  return paths;
}

/**
 * Page 1 of a PDF as a JPEG cover file (2:3 friendly, at least the minimum
 * cover width), for "Use the PDF's first page as the cover".
 */
export async function coverFromPdf(file: File): Promise<File> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${pdfjs.version}`;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const doc = await task.promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.max(COVER.minWidth, 900) / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    if (!blob) throw new Error("The first page could not be turned into an image.");
    return new File([blob], `${file.name.replace(/\.pdf$/i, "")}-cover.jpg`, { type: "image/jpeg" });
  } finally {
    await task.destroy();
  }
}
