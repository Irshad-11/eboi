"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BUCKETS } from "@/config/storage";
import { createSessionClient } from "@/lib/supabase/server";
import { bookInputSchema, bookJsonSchema, type BookFormValues } from "@/features/books/schema";
import { requireAdmin } from "../auth";
import { belongsToBook } from "../paths";
import { removeFiles, verifyCover, verifyPreview } from "../storage.server";
import { dbError, fail, zodFieldErrors, type ActionResult } from "../action-result";

const fileChange = z
  .union([z.object({ path: z.string().max(200) }), z.object({ remove: z.literal(true) })])
  .nullish();

const saveSchema = z.object({
  id: z.uuid(),
  isNew: z.boolean(),
  bookCode: z
    .string()
    .regex(/^EB-\d{4,}$/)
    .nullish(),
  values: z.unknown(),
  collectionIds: z.array(z.uuid()).max(50),
  cover: fileChange,
  preview: fileChange,
});

export type SaveBookInput = {
  id: string;
  isNew: boolean;
  /** Only for imports that carry their own Book ID. */
  bookCode?: string | null;
  values: BookFormValues;
  collectionIds: string[];
  cover?: { path: string } | { remove: true } | null;
  preview?: { path: string } | { remove: true } | null;
};

/**
 * Create or update a book, its files and its collections in one go.
 * Files were uploaded by the browser straight to private storage; here they
 * are verified byte by byte. If anything fails, the new uploads are deleted
 * so nothing is left orphaned. Replaced files are deleted after success.
 */
export async function saveBook(input: SaveBookInput): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return fail("The form data was not valid.");
  const { id, isNew, bookCode, collectionIds, cover, preview } = parsed.data;

  const newCover = cover && "path" in cover ? cover.path : null;
  const newPreview = preview && "path" in preview ? preview.path : null;
  // Only ever clean up files inside this book's own folder.
  const own = (p: string | null) => (p && belongsToBook(p, id) ? p : null);
  const cleanupNew = () =>
    Promise.all([removeFiles(BUCKETS.covers, [own(newCover)]), removeFiles(BUCKETS.previews, [own(newPreview)])]);

  const values = bookInputSchema.safeParse(parsed.data.values);
  if (!values.success) {
    await cleanupNew();
    return fail("Some fields need fixing.", zodFieldErrors(values.error));
  }

  // Verify uploads before touching the database.
  if (newCover) {
    const msg = belongsToBook(newCover, id) ? await verifyCover(newCover) : "Cover path is not in this book's folder.";
    if (msg) {
      await cleanupNew();
      return fail(msg, { cover: msg });
    }
  }
  let previewPages: number | null = null;
  if (newPreview) {
    const check = belongsToBook(newPreview, id) ? await verifyPreview(newPreview) : { error: "Preview path is not in this book's folder." };
    if ("error" in check) {
      await cleanupNew();
      return fail(check.error, { preview: check.error });
    }
    previewPages = check.pages;
  }

  const supabase = await createSessionClient();
  const { data: existing } = await supabase.from("books").select("cover_path, preview_path").eq("id", id).maybeSingle();
  if (!isNew && !existing) {
    await cleanupNew();
    return fail("This book no longer exists.");
  }

  const fileFields: Record<string, string | number | null> = {};
  if (newCover) fileFields.cover_path = newCover;
  else if (cover && "remove" in cover) fileFields.cover_path = null;
  if (newPreview) {
    fileFields.preview_path = newPreview;
    fileFields.preview_page_count = previewPages;
  } else if (preview && "remove" in preview) {
    fileFields.preview_path = null;
    fileFields.preview_page_count = null;
  }

  const row = { ...values.data, ...fileFields };
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

  const syncError = await syncBookCollections(id, collectionIds);

  // Old files go only after the new row is safely saved.
  if (existing) {
    if ("cover_path" in fileFields && existing.cover_path !== fileFields.cover_path) await removeFiles(BUCKETS.covers, [existing.cover_path]);
    if ("preview_path" in fileFields && existing.preview_path !== fileFields.preview_path) await removeFiles(BUCKETS.previews, [existing.preview_path]);
  }

  revalidatePath("/", "layout");
  if (syncError) return { ok: true, data: saved, message: `Saved, but collections did not update: ${syncError}` };
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
    // New members go to the end of each collection's manual order.
    const { data: tails } = await supabase.from("collection_books").select("collection_id, position").in("collection_id", toAdd);
    const maxPos = new Map<string, number>();
    for (const t of tails ?? []) maxPos.set(t.collection_id, Math.max(maxPos.get(t.collection_id) ?? 0, t.position));
    const { error: e } = await supabase
      .from("collection_books")
      .insert(toAdd.map((c) => ({ collection_id: c, book_id: bookId, position: (maxPos.get(c) ?? 0) + 1 })));
    if (e) return e.message;
  }
  return null;
}

/** Deletes the row, then its cover and preview. Sales history keeps its snapshots. */
export async function deleteBook(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return fail("Unknown book.");
  const supabase = await createSessionClient();
  const { data: book } = await supabase.from("books").select("cover_path, preview_path").eq("id", id).maybeSingle();
  if (!book) return fail("This book was already deleted.");
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return fail(dbError(error, "delete"));
  await Promise.all([removeFiles(BUCKETS.covers, [book.cover_path]), removeFiles(BUCKETS.previews, [book.preview_path])]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Book, cover and preview deleted." };
}

/** Called by the browser when a save never reached the server (e.g. network drop after upload). */
export async function discardUploads(bookId: string, paths: { cover?: string | null; preview?: string | null }): Promise<void> {
  await requireAdmin();
  if (!z.uuid().safeParse(bookId).success) return;
  const supabase = await createSessionClient();
  const { data: row } = await supabase.from("books").select("cover_path, preview_path").eq("id", bookId).maybeSingle();
  // Never delete a file that a saved row points to.
  const safe = (p: string | null | undefined, inUse: string | null | undefined) => (p && belongsToBook(p, bookId) && p !== inUse ? p : null);
  await Promise.all([
    removeFiles(BUCKETS.covers, [safe(paths.cover, row?.cover_path)]),
    removeFiles(BUCKETS.previews, [safe(paths.preview, row?.preview_path)]),
  ]);
}

export type ImportPlan = {
  id: string;
  mode: "create" | "update";
  bookCode: string | null;
  collectionIds: string[];
  unknownCollections: string[];
  values: BookFormValues;
};

/**
 * Step 1 of a JSON import: validate the file and decide create vs update.
 * Matching order: book_code, then slug. The browser then uploads files into
 * the chosen book folder and calls saveBook with this plan.
 */
export async function prepareImport(json: unknown): Promise<ActionResult<ImportPlan>> {
  await requireAdmin();
  const parsed = bookJsonSchema.safeParse(json);
  if (!parsed.success) return fail("The JSON does not match the book format.", zodFieldErrors(parsed.error));
  const b = parsed.data;
  const supabase = await createSessionClient();

  let existing: { id: string; book_code: string } | null = null;
  if (b.book_code) {
    const { data } = await supabase.from("books").select("id, book_code").eq("book_code", b.book_code).maybeSingle();
    existing = data;
  }
  if (!existing) {
    const { data } = await supabase.from("books").select("id, book_code").eq("slug", b.slug).maybeSingle();
    existing = data;
  }

  const { data: cols } = b.collections.length
    ? await supabase.from("collections").select("id, slug").in("slug", b.collections)
    : { data: [] as { id: string; slug: string }[] };
  const found = new Map((cols ?? []).map((c) => [c.slug, c.id]));

  // Keep only the book fields; the rest is import metadata.
  const { $schema, format_version, book_code, collections, files, ...values } = b;
  return {
    ok: true,
    data: {
      id: existing?.id ?? crypto.randomUUID(),
      mode: existing ? "update" : "create",
      bookCode: existing ? null : (book_code ?? null),
      collectionIds: collections.flatMap((s) => (found.has(s) ? [found.get(s)!] : [])),
      unknownCollections: collections.filter((s) => !found.has(s)),
      values,
    },
  };
}
