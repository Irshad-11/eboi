import "server-only";
import { PDFDocument } from "pdf-lib";
import { COVER, MEDIA, PREVIEW } from "@/config/limits";
import { BUCKETS, type BucketName } from "@/config/storage";
import { isValidImageUrl } from "@/lib/media";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Server-side file checks and deletions. Every upload is re-validated by
 * reading the actual bytes, not the file name or the browser's MIME type.
 */

async function download(bucket: BucketName, path: string): Promise<Uint8Array | null> {
  const { data, error } = await createServiceClient().storage.from(bucket).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[i + offset] === v);
const isJpeg = (b: Uint8Array) => startsWith(b, [0xff, 0xd8, 0xff]);
const isPng = (b: Uint8Array) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]);
const isWebp = (b: Uint8Array) => startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8);
const isGif = (b: Uint8Array) => startsWith(b, [0x47, 0x49, 0x46, 0x38]);
const isImage = (b: Uint8Array) => isJpeg(b) || isPng(b) || isWebp(b) || isGif(b);
const mbOf = (n: number) => `${Math.round(n / 1024 / 1024)} MB`;

export async function verifyCover(path: string): Promise<string | null> {
  const bytes = await download(BUCKETS.covers, path);
  if (!bytes) return "The cover upload could not be found.";
  if (bytes.byteLength > COVER.maxBytes) return `The cover is larger than ${mbOf(COVER.maxBytes)}.`;
  if (!isImage(bytes)) return "The cover is not a real JPG, PNG, WebP or GIF file.";
  return null;
}

export async function verifyMediaImage(path: string): Promise<string | null> {
  const bytes = await download(BUCKETS.media, path);
  if (!bytes) return "The image upload could not be found.";
  if (bytes.byteLength > MEDIA.maxBytes) return `The image is larger than ${mbOf(MEDIA.maxBytes)}.`;
  if (!isImage(bytes)) return "The file is not a real JPG, PNG, WebP or GIF image.";
  return null;
}

export async function verifyPreview(path: string): Promise<{ error: string } | { pages: number }> {
  const bytes = await download(BUCKETS.previews, path);
  if (!bytes) return { error: "The preview upload could not be found." };
  if (bytes.byteLength > PREVIEW.maxBytes) return { error: "The preview is larger than the limit." };
  if (!startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return { error: "The preview is not a real PDF file." };
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    const pages = doc.getPageCount();
    if (pages > PREVIEW.maxPages) return { error: `The preview has ${pages} pages; the maximum is ${PREVIEW.maxPages}.` };
    return { pages };
  } catch {
    return { error: "The preview PDF could not be read." };
  }
}

/** Deletes files, logging (not throwing) on failure: the orphan sweep catches leftovers. */
export async function removeFiles(bucket: BucketName, paths: (string | null | undefined)[]): Promise<void> {
  // Pasted image links are not files in storage: nothing to delete.
  const list = [...new Set(paths.filter((p): p is string => Boolean(p) && !/^https?:\/\//i.test(p!)))];
  if (!list.length) return;
  const { error } = await createServiceClient().storage.from(bucket).remove(list);
  if (error) console.error(`[storage] remove from ${bucket} failed:`, error.message);
}

/** Every object in a bucket, walking folders up to three levels deep. */
export async function listAllObjects(bucket: BucketName): Promise<{ path: string; createdAt: string | null }[]> {
  const storage = createServiceClient().storage.from(bucket);
  const out: { path: string; createdAt: string | null }[] = [];
  async function walk(prefix: string, depth: number): Promise<void> {
    let offset = 0;
    for (;;) {
      const { data, error } = await storage.list(prefix, { limit: 1000, offset });
      if (error) throw new Error(error.message);
      for (const f of data ?? []) {
        const full = prefix ? `${prefix}/${f.name}` : f.name;
        if (f.id) out.push({ path: full, createdAt: f.created_at ?? null });
        else if (depth < 3) await walk(full, depth + 1);
      }
      if (!data || data.length < 1000) break;
      offset += 1000;
    }
  }
  await walk("", 0);
  return out;
}

/** Validates a new media path for an owner, returning an error message or null. */
export async function checkNewMedia(path: string | null | undefined, ok: (p: string) => boolean): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return isValidImageUrl(path) ? null : "Use a full https:// image link.";
  if (!ok(path)) return "That image is not in the right folder.";
  return verifyMediaImage(path);
}
