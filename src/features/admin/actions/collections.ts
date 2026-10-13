"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BUCKETS, MEDIA_FOLDERS } from "@/config/storage";
import { sanitizeRichText } from "@/lib/rich-text";
import { slugify } from "@/lib/slug";
import { AUTO_COLLECTION_SLUGS } from "@/config/site";
import { createSessionClient } from "@/lib/supabase/server";
import { collectionInputSchema, type CollectionFormValues } from "@/features/collections/schema";
import { requireAdmin } from "../auth";
import { belongsToMedia } from "../paths";
import { checkNewMedia, removeFiles } from "../storage.server";
import { dbError, fail, zodFieldErrors, type ActionResult } from "../action-result";

export async function saveCollection(id: string, isNew: boolean, values: CollectionFormValues): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return fail("Unknown collection.");
  const parsed = collectionInputSchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  const row = { ...parsed.data, description: sanitizeRichText(parsed.data.description) };
  const supabase = await createSessionClient();
  const { data: old } = await supabase.from("collections").select("image_path, og_image_path").eq("id", id).maybeSingle();

  if (row.image_path && row.image_path !== old?.image_path) {
    const msg = await checkNewMedia(row.image_path, (p) => belongsToMedia(p, MEDIA_FOLDERS.collections, id));
    if (msg) return fail(msg, { image_path: msg });
  }
  if (row.og_image_path && row.og_image_path !== old?.og_image_path) {
    const msg = await checkNewMedia(row.og_image_path, (p) => belongsToMedia(p, MEDIA_FOLDERS.seo, id));
    if (msg) return fail(msg, { og_image_path: msg });
  }

  const res = isNew || !old ? await supabase.from("collections").insert({ id, ...row }).select("id").single() : await supabase.from("collections").update(row).eq("id", id).select("id").single();
  if (res.error || !res.data) return fail(dbError(res.error ?? { message: "unknown" }));
  if (old) {
    await removeFiles(BUCKETS.media, [
      old.image_path !== row.image_path ? old.image_path : null,
      old.og_image_path !== row.og_image_path ? old.og_image_path : null,
    ]);
  }
  revalidatePath("/", "layout");
  return { ok: true, data: { id }, message: isNew ? "Collection created." : "Saved." };
}

/**
 * Book form shortcut: a new, empty collection from just a name (the slug is
 * made from it). Details can be filled in later under Collections.
 */
export async function quickCreateCollection(name: string): Promise<ActionResult<{ id: string; name: string }>> {
  await requireAdmin();
  const clean = name.trim().replace(/\s+/g, " ");
  if (clean.length < 2 || clean.length > 80) return fail("Use 2 to 80 characters.");
  const supabase = await createSessionClient();
  const { data: same } = await supabase.from("collections").select("id, name").ilike("name", clean).maybeSingle();
  if (same) return { ok: true, data: same, message: "That collection already exists. It is now ticked." };
  const base = slugify(clean, "collection").slice(0, 70);
  const { data: taken } = await supabase.from("collections").select("slug").like("slug", `${base}%`);
  const used = new Set([...(taken ?? []).map((r) => r.slug), ...(AUTO_COLLECTION_SLUGS as string[])]);
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  const { data, error } = await supabase.from("collections").insert({ name: clean, slug }).select("id, name").single();
  if (error || !data) return fail(dbError(error ?? { message: "unknown" }));
  revalidatePath("/", "layout");
  return { ok: true, data, message: `Collection “${data.name}” created.` };
}

/** Replaces the collection's books with this exact ordered list. */
export async function setCollectionBooks(id: string, bookIds: string[]): Promise<ActionResult> {
  await requireAdmin();
  const ids = z.array(z.uuid()).max(500).safeParse(bookIds);
  if (!z.uuid().safeParse(id).success || !ids.success) return fail("Invalid list.");
  const supabase = await createSessionClient();
  const { error: delErr } = await supabase.from("collection_books").delete().eq("collection_id", id);
  if (delErr) return fail(dbError(delErr));
  if (ids.data.length) {
    const { error } = await supabase.from("collection_books").insert([...new Set(ids.data)].map((book_id, i) => ({ collection_id: id, book_id, position: i + 1 })));
    if (error) return fail(dbError(error));
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Books saved." };
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data: old } = await supabase.from("collections").select("image_path, og_image_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return fail(dbError(error, "delete"));
  await removeFiles(BUCKETS.media, [old?.image_path, old?.og_image_path]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Collection deleted. Its books are untouched." };
}

export async function reorderCollections(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.array(z.uuid()).max(200).safeParse(ids);
  if (!parsed.success) return fail("Invalid order.");
  const supabase = await createSessionClient();
  for (const [i, cid] of parsed.data.entries()) {
    const { error } = await supabase.from("collections").update({ sort_order: i + 1 }).eq("id", cid);
    if (error) return fail(dbError(error));
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Order saved." };
}
