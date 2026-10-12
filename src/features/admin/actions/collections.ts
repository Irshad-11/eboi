"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/server";
import { collectionInputSchema, type CollectionFormValues } from "@/features/collections/schema";
import { requireAdmin } from "../auth";
import { dbError, fail, zodFieldErrors, type ActionResult } from "../action-result";

export async function saveCollection(id: string | null, values: CollectionFormValues): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = collectionInputSchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  const supabase = await createSessionClient();
  const res = id
    ? await supabase.from("collections").update(parsed.data).eq("id", id).select("id").single()
    : await supabase.from("collections").insert(parsed.data).select("id").single();
  if (res.error || !res.data) return fail(dbError(res.error ?? { message: "unknown" }));
  revalidatePath("/", "layout");
  return { ok: true, data: { id: res.data.id }, message: id ? "Saved." : "Collection created." };
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
    const { error } = await supabase
      .from("collection_books")
      .insert([...new Set(ids.data)].map((book_id, i) => ({ collection_id: id, book_id, position: i + 1 })));
    if (error) return fail(dbError(error));
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Order saved." };
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return fail(dbError(error, "delete"));
  revalidatePath("/", "layout");
  return { ok: true, message: "Collection deleted. Its books are untouched." };
}
