"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BUCKETS, MEDIA_FOLDERS } from "@/config/storage";
import { SLUG_PATTERN } from "@/lib/slug";
import { createSessionClient } from "@/lib/supabase/server";
import { requireAdmin } from "../auth";
import { belongsToMedia } from "../paths";
import { checkNewMedia, removeFiles } from "../storage.server";
import { dbError, fail, zodFieldErrors, type ActionResult } from "../action-result";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Add a name").max(60),
  slug: z.string().trim().toLowerCase().regex(SLUG_PATTERN, "Lowercase letters, numbers and dashes").max(80),
  icon: z.string().trim().max(20).default("book"),
  image_path: z.string().max(200).nullable(),
  sort_order: z.coerce.number().int().min(-1000).max(1000).default(0),
  show_in_nav: z.boolean(),
  show_on_home: z.boolean(),
});

export type CategoryInput = z.input<typeof categorySchema>;

export async function saveCategory(id: string, isNew: boolean, values: CategoryInput): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return fail("Unknown category.");
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  const supabase = await createSessionClient();
  const { data: old } = await supabase.from("categories").select("image_path").eq("id", id).maybeSingle();
  if (parsed.data.image_path && parsed.data.image_path !== old?.image_path) {
    const msg = await checkNewMedia(parsed.data.image_path, (p) => belongsToMedia(p, MEDIA_FOLDERS.categories, id));
    if (msg) return fail(msg, { image_path: msg });
  }
  const { error } = isNew || !old
    ? await supabase.from("categories").insert({ id, ...parsed.data })
    : await supabase.from("categories").update(parsed.data).eq("id", id);
  if (error) return fail(dbError(error));
  if (old?.image_path && old.image_path !== parsed.data.image_path) await removeFiles(BUCKETS.media, [old.image_path]);
  revalidatePath("/", "layout");
  return { ok: true, message: isNew ? "Category added." : "Saved. Books in this category were updated too." };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data: old } = await supabase.from("categories").select("image_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return fail(dbError(error, "delete"));
  await removeFiles(BUCKETS.media, [old?.image_path]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Category removed. Its books keep their category text." };
}

/** Saves a new order: sort_order follows the list position. */
export async function reorderCategories(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.array(z.uuid()).max(200).safeParse(ids);
  if (!parsed.success) return fail("Invalid order.");
  const supabase = await createSessionClient();
  for (const [i, cid] of parsed.data.entries()) {
    const { error } = await supabase.from("categories").update({ sort_order: i + 1 }).eq("id", cid);
    if (error) return fail(dbError(error));
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Order saved." };
}
