"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BUCKETS, MEDIA_FOLDERS } from "@/config/storage";
import { sanitizeRichText } from "@/lib/rich-text";
import { createSessionClient } from "@/lib/supabase/server";
import { bookInputSchema, bookJsonSchema, type BookFormValues } from "@/features/books/schema";
import { requireAdmin } from "../auth";
import { belongsToBook, belongsToMedia } from "../paths";
import { removeFiles, verifyCover, verifyMediaImage, verifyPreview } from "../storage.server";
import { dbError, fail, zodFieldErrors, type ActionResult } from "../action-result";

const fileChange = z.union([z.object({ path: z.string().max(200) }), z.object({ remove: z.literal(true) })]).nullish();

const reviewSchema = z.object({
  author_name: z.string().trim().min(1, "Add a name").max(80),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().max(1500).default(""),
  review_date: z.iso.date(),
  is_visible: z.boolean().default(true),
});

const saveSchema = z.object({
  id: z.uuid(),
  isNew: z.boolean(),
  bookCode: z.string().regex(/^EB-\d{4,}$/).nullish(),
  values: z.unknown(),
  collectionIds: z.array(z.uuid()).max(50),
  cover: fileChange,
  preview: fileChange,
  /** New thumbnails made from a new preview (replace the old set). */
  thumbs: z.array(z.string().max(200)).max(8).nullish(),
  ogImage: z.string().max(200).nullable().optional(),
  reviews: z.array(reviewSchema).max(50).nullish(),
});

export type ReviewInput = z.input<typeof reviewSchema>;

export type SaveBookInput = {
  id: string;
  isNew: boolean;
  bookCode?: string | null;
  values: BookFormValues;
  collectionIds: string[];
  cover?: { path: string } | { remove: true } | null;
  preview?: { path: string } | { remove: true } | null;
  thumbs?: string[] | null;
  /** undefined = unchanged, null = removed, string = new share image. */
  ogImage?: string | null;
  /** undefined/null = leave reviews as they are. */
  reviews?: ReviewInput[] | null;
};

/**
 * Create or update a book with its files, collections and reviews. Files were
 * uploaded by the browser to private storage; here every one is verified
 * byte by byte. On failure the new uploads are deleted; after success the
 * files they replaced are deleted. No orphans either way.
 */
export async function saveBook(input: SaveBookInput): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return fail("The form data was not valid.", zodFieldErrors(parsed.error));
  const { id, isNew, bookCode, collectionIds, cover, preview, thumbs, ogImage, reviews } = parsed.data;

  const newCover = cover && "path" in cover ? cover.path : null;
  const newPreview = preview && "path" in preview ? preview.path : null;
  const ownBook = (p: string | null) => (p && belongsToBook(p, id) ? p : null);
  const ownThumb = (p: string) => belongsToMedia(p, MEDIA_FOLDERS.thumbs, id);
  const ownOg = (p: string | null | undefined) => (p && belongsToMedia(p, MEDIA_FOLDERS.seo, id) ? p : null);
  const cleanupNew = () =>
    Promise.all([
      removeFiles(BUCKETS.covers, [ownBook(newCover)]),
      removeFiles(BUCKETS.previews, [ownBook(newPreview)]),
      removeFiles(BUCKETS.media, [...(thumbs ?? []).filter(ownThumb), ownOg(ogImage)]),
    ]);

  const values = bookInputSchema.safeParse(parsed.data.values);
  if (!values.success) {
    await cleanupNew();
    return fail("Some fields need fixing.", zodFieldErrors(values.error));
  }

  if (newCover) {
    const msg = belongsToBook(newCover, id) ? await verifyCover(newCover) : "Cover is not in this book's folder.";
    if (msg) {
      await cleanupNew();
      return fail(msg, { cover: msg });
    }
  }
  let previewPages: number | null = null;
  if (newPreview) {
    const check = belongsToBook(newPreview, id) ? await verifyPreview(newPreview) : { error: "Preview is not in this book's folder." };
    if ("error" in check) {
      await cleanupNew();
      return fail(check.error, { preview: check.error });
    }
    previewPages = check.pages;
  }
  for (const t of thumbs ?? []) {
    const msg = ownThumb(t) ? await verifyMediaImage(t) : "Thumbnail is not in this book's folder.";
    if (msg) {
      await cleanupNew();
      return fail(msg, { preview: msg });
    }
  }
  if (ogImage) {
    const msg = ownOg(ogImage) ? await verifyMediaImage(ogImage) : "Share image is not in this book's folder.";
    if (msg) {
      await cleanupNew();
      return fail(msg, { og_image_path: msg });
    }
  }

  const supabase = await createSessionClient();
  const { data: existing } = await supabase.from("books").select("cover_path, preview_path, preview_thumbs, og_image_path").eq("id", id).maybeSingle();
  if (!isNew && !existing) {
    await cleanupNew();
    return fail("This book no longer exists.");
  }

  const files: Record<string, unknown> = {};
  if (newCover) files.cover_path = newCover;
  else if (cover && "remove" in cover) files.cover_path = null;
  if (newPreview) {
    files.preview_path = newPreview;
    files.preview_page_count = previewPages;
    files.preview_thumbs = thumbs ?? [];
  } else if (preview && "remove" in preview) {
    files.preview_path = null;
    files.preview_page_count = null;
    files.preview_thumbs = [];
  } else if (thumbs) {
    files.preview_thumbs = thumbs;
  }
  if (ogImage !== undefined) files.og_image_path = ogImage;

  const row = { ...values.data, description: sanitizeRichText(values.data.description), ...files };
  const { data: saved, error } = existing
    ? await supabase.from("books").update(row).eq("id", id).select("id, slug").single()
    : await supabase
        .from("books")
        .insert({ id, ...(bookCode ? { book_code: bookCode } : {}), ...row })
        .select("id, slug")
        .single();
  if (error || !saved) {
    await cleanupNew();
    return fail(dbError(error ?? { message: "unknown" }));
  }

  const problems: string[] = [];
  const syncError = await syncBookCollections(id, collectionIds);
  if (syncError) problems.push(`collections: ${syncError}`);
  if (reviews) {
    const { error: delErr } = await supabase.from("book_reviews").delete().eq("book_id", id);
    if (delErr) problems.push(`reviews: ${delErr.message}`);
    else if (reviews.length) {
      const { error: insErr } = await supabase.from("book_reviews").insert(reviews.map((r, i) => ({ ...r, book_id: id, sort_order: i })));
      if (insErr) problems.push(`reviews: ${insErr.message}`);
    }
  }

  // Old files go only after the new row is safely saved.
  if (existing) {
    if ("cover_path" in files && existing.cover_path !== files.cover_path) await removeFiles(BUCKETS.covers, [existing.cover_path]);
    if ("preview_path" in files && existing.preview_path !== files.preview_path) await removeFiles(BUCKETS.previews, [existing.preview_path]);
    if ("preview_thumbs" in files) {
      const keep = new Set(files.preview_thumbs as string[]);
      await removeFiles(BUCKETS.media, (existing.preview_thumbs ?? []).filter((t) => !keep.has(t)));
    }
    if ("og_image_path" in files && existing.og_image_path !== files.og_image_path) await removeFiles(BUCKETS.media, [existing.og_image_path]);
  }

  revalidatePath("/", "layout");
  if (problems.length) return { ok: true, data: saved, message: `Saved, but some parts did not update (${problems.join("; ")}).` };
  return { ok: true, data: saved, message: isNew ? "Book created." : "Saved." };
}

async function syncBookCollections(bookId: string, wanted: string[]): Promise<string | null> {
  const supabase = await createSessionClient();
  const { data: current, error } = await supabase.from("collection_books").select("collection_id").eq("book_id", bookId);
  if (error) return error.message;
  const have = new Set((current ?? []).map((r) => r.collection_id));
  const want = new Set(wanted);
  const toRemove = [...have].filter((c) => !want.has(c));
  const toAdd = [...want].filter((c) => !have.has(c));
  if (toRemove.length) {
    const { error: e } = await supabase.from("collection_books").delete().eq("book_id", bookId).in("collection_id", toRemove);
    if (e) return e.message;
  }
  if (toAdd.length) {
    const { data: tails } = await supabase.from("collection_books").select("collection_id, position").in("collection_id", toAdd);
    const maxPos = new Map<string, number>();
    for (const t of tails ?? []) maxPos.set(t.collection_id, Math.max(maxPos.get(t.collection_id) ?? 0, t.position));
    const { error: e } = await supabase.from("collection_books").insert(toAdd.map((c) => ({ collection_id: c, book_id: bookId, position: (maxPos.get(c) ?? 0) + 1 })));
    if (e) return e.message;
  }
  return null;
}

/** Deletes the row, then its cover, preview, thumbnails and share image. */
export async function deleteBook(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return fail("Unknown book.");
  const supabase = await createSessionClient();
  const { data: book } = await supabase.from("books").select("cover_path, preview_path, preview_thumbs, og_image_path").eq("id", id).maybeSingle();
  if (!book) return fail("This book was already deleted.");
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return fail(dbError(error, "delete"));
  await Promise.all([
    removeFiles(BUCKETS.covers, [book.cover_path]),
    removeFiles(BUCKETS.previews, [book.preview_path]),
    removeFiles(BUCKETS.media, [...(book.preview_thumbs ?? []), book.og_image_path]),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Book and its files deleted." };
}

/** Called when a save never reached the server after files were uploaded. */
export async function discardUploads(bookId: string, paths: { cover?: string | null; preview?: string | null; thumbs?: string[]; og?: string | null }): Promise<void> {
  await requireAdmin();
  if (!z.uuid().safeParse(bookId).success) return;
  const supabase = await createSessionClient();
  const { data: row } = await supabase.from("books").select("cover_path, preview_path, preview_thumbs, og_image_path").eq("id", bookId).maybeSingle();
  const inUse = new Set([row?.cover_path, row?.preview_path, row?.og_image_path, ...(row?.preview_thumbs ?? [])].filter(Boolean));
  const safeBook = (p: string | null | undefined) => (p && belongsToBook(p, bookId) && !inUse.has(p) ? p : null);
  const safeMedia = (p: string | null | undefined) =>
    p && !inUse.has(p) && (belongsToMedia(p, MEDIA_FOLDERS.thumbs, bookId) || belongsToMedia(p, MEDIA_FOLDERS.seo, bookId)) ? p : null;
  await Promise.all([
    removeFiles(BUCKETS.covers, [safeBook(paths.cover)]),
    removeFiles(BUCKETS.previews, [safeBook(paths.preview)]),
    removeFiles(BUCKETS.media, [...(paths.thumbs ?? []).map(safeMedia), safeMedia(paths.og)]),
  ]);
}

export type ImportPlan = {
  id: string;
  mode: "create" | "update";
  bookCode: string | null;
  collectionIds: string[];
  unknownCollections: string[];
  values: BookFormValues;
  /** undefined = keep the book's reviews as they are. */
  reviews?: ReviewInput[];
};

/** Step 1 of a JSON import: validate, then decide create or update (by book_code, then slug). */
export async function prepareImport(json: unknown): Promise<ActionResult<ImportPlan>> {
  await requireAdmin();
  const parsed = bookJsonSchema.safeParse(json);
  if (!parsed.success) return fail("The JSON does not match the book format.", zodFieldErrors(parsed.error));
  const b = parsed.data;
  const supabase = await createSessionClient();

  let existing: { id: string; book_code: string } | null = null;
  if (b.book_code) existing = (await supabase.from("books").select("id, book_code").eq("book_code", b.book_code).maybeSingle()).data;
  if (!existing) existing = (await supabase.from("books").select("id, book_code").eq("slug", b.slug).maybeSingle()).data;

  const { data: cols } = b.collections.length
    ? await supabase.from("collections").select("id, slug").in("slug", b.collections)
    : { data: [] as { id: string; slug: string }[] };
  const found = new Map((cols ?? []).map((c) => [c.slug, c.id]));

  // Keep only the book fields; the rest is import metadata.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- import metadata, not book fields
  const { $schema, format_version, book_code, collections, files, reviews, ...values } = b;
  return {
    ok: true,
    data: {
      id: existing?.id ?? crypto.randomUUID(),
      mode: existing ? "update" : "create",
      bookCode: existing ? null : (book_code ?? null),
      collectionIds: collections.flatMap((s) => (found.has(s) ? [found.get(s)!] : [])),
      unknownCollections: collections.filter((s) => !found.has(s)),
      values,
      reviews,
    },
  };
}
