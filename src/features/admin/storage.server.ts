import "server-only";
import { PDFDocument } from "pdf-lib";
import { COVER, PREVIEW } from "@/config/limits";
import { BUCKETS, type BucketName } from "@/config/storage";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Server-side file checks and deletions. Every upload is re-validated here
 * by reading the actual bytes, not the file name or the browser's MIME type.
 */

async function download(bucket: BucketName, path: string): Promise<Uint8Array | null> {
  const { data, error } = await createServiceClient().storage.from(bucket).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

const startsWith = (b: Uint8Array, sig: number[]) => sig.every((v, i) => b[i] === v);

export async function verifyCover(path: string): Promise<string | null> {
  const bytes = await download(BUCKETS.covers, path);
  if (!bytes) return "The cover upload could not be found.";
  if (bytes.byteLength > COVER.maxBytes) return "The cover is larger than 2 MB.";
  const isJpeg = startsWith(bytes, [0xff, 0xd8, 0xff]);
  const isPng = startsWith(bytes, [0x89, 0x50, 0x4e, 0x47]);
  if (!isJpeg && !isPng) return "The cover is not a real JPG or PNG file.";
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

/** Deletes files, logging (not throwing) on failure: the orphan sweeper catches leftovers. */
export async function removeFiles(bucket: BucketName, paths: (string | null | undefined)[]): Promise<void> {
  const list = paths.filter((p): p is string => Boolean(p));
  if (!list.length) return;
  const { error } = await createServiceClient().storage.from(bucket).remove(list);
  if (error) console.error(`[storage] remove from ${bucket} failed:`, error.message);
}

/** Every object in a bucket (our layout is one folder level deep: <book id>/<file>). */
export async function listAllObjects(bucket: BucketName): Promise<{ path: string; createdAt: string | null }[]> {
  const storage = createServiceClient().storage.from(bucket);
  const out: { path: string; createdAt: string | null }[] = [];
  const { data: folders, error } = await storage.list("", { limit: 1000 });
  if (error) throw new Error(error.message);
  for (const f of folders ?? []) {
    // Folders come back with id === null; loose root files have an id.
    if (f.id) {
      out.push({ path: f.name, createdAt: f.created_at ?? null });
      continue;
    }
    let offset = 0;
    for (;;) {
      const { data: files, error: e2 } = await storage.list(f.name, { limit: 1000, offset });
      if (e2) throw new Error(e2.message);
      for (const file of files ?? []) if (file.id) out.push({ path: `${f.name}/${file.name}`, createdAt: file.created_at ?? null });
      if (!files || files.length < 1000) break;
      offset += 1000;
    }
  }
  return out;
}
