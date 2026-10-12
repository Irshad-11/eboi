"use server";

import { revalidatePath } from "next/cache";
import { BUCKETS } from "@/config/storage";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "../auth";
import { fail, type ActionResult } from "../action-result";
import { deleteDemo, hasDemoData, loadDemo } from "../demo/seed";
import { listAllObjects, removeFiles } from "../storage.server";

export async function loadDemoData(): Promise<ActionResult> {
  await requireAdmin();
  if (await hasDemoData()) return fail("Demo data is already loaded. Delete it first to load a fresh copy.");
  try {
    const r = await loadDemo();
    revalidatePath("/", "layout");
    return { ok: true, message: `Loaded ${r.books} demo books with covers and previews, ${r.sales} sales and ${r.events.toLocaleString("en-IN")} analytics events.` };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Demo load failed.");
  }
}

export async function deleteDemoData(): Promise<ActionResult> {
  await requireAdmin();
  try {
    const r = await deleteDemo();
    revalidatePath("/", "layout");
    return { ok: true, message: `Deleted ${r.books} demo books, ${r.files} storage files and all demo offers, collections, sales and events.` };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Delete failed.");
  }
}

/**
 * Orphan sweep: deletes storage files that no book points to. Files younger
 * than an hour are left alone, because an upload may be mid-save right now.
 */
export async function sweepOrphanFiles(): Promise<ActionResult> {
  await requireAdmin();
  const db = createServiceClient();
  const { data: books, error } = await db.from("books").select("cover_path, preview_path");
  if (error) return fail(error.message);
  const used = new Set((books ?? []).flatMap((b) => [b.cover_path, b.preview_path]).filter(Boolean) as string[]);
  const cutoff = Date.now() - 60 * 60 * 1000;
  let removed = 0;
  try {
    for (const bucket of [BUCKETS.covers, BUCKETS.previews] as const) {
      const all = await listAllObjects(bucket);
      const orphans = all.filter((o) => !used.has(o.path) && (!o.createdAt || Date.parse(o.createdAt) < cutoff)).map((o) => o.path);
      await removeFiles(bucket, orphans);
      removed += orphans.length;
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not list storage.");
  }
  return { ok: true, message: removed ? `Removed ${removed} orphan files.` : "No orphan files. Storage is clean." };
}
