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
    return { ok: true, message: `Loaded ${r.books} demo books with covers, previews and reviews, hero slides, ${r.sales} sales and ${r.events.toLocaleString("en-IN")} analytics events.` };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Demo load failed.");
  }
}

export async function deleteDemoData(): Promise<ActionResult> {
  await requireAdmin();
  try {
    const r = await deleteDemo();
    revalidatePath("/", "layout");
    return { ok: true, message: `Deleted ${r.books} demo books, ${r.files} storage files and all demo slides, categories, offers, collections, sales and events.` };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Delete failed.");
  }
}

/** Every storage path the database points to, across all tables. */
async function referencedPaths(db: ReturnType<typeof createServiceClient>): Promise<Set<string>> {
  const [books, banners, categories, collections, pages, settings] = await Promise.all([
    db.from("books").select("cover_path, preview_path, preview_thumbs, og_image_path"),
    db.from("banners").select("image_desktop_path, image_mobile_path"),
    db.from("categories").select("image_path"),
    db.from("collections").select("image_path, og_image_path"),
    db.from("page_seo").select("og_image_path"),
    db.from("site_settings").select("default_og_image_path"),
  ]);
  const failed = [books, banners, categories, collections, pages, settings].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  const paths: (string | null | undefined)[] = [
    ...(books.data ?? []).flatMap((b) => [b.cover_path, b.preview_path, b.og_image_path, ...(b.preview_thumbs ?? [])]),
    ...(banners.data ?? []).flatMap((b) => [b.image_desktop_path, b.image_mobile_path]),
    ...(categories.data ?? []).map((c) => c.image_path),
    ...(collections.data ?? []).flatMap((c) => [c.image_path, c.og_image_path]),
    ...(pages.data ?? []).map((p) => p.og_image_path),
    ...(settings.data ?? []).map((s) => s.default_og_image_path),
  ];
  return new Set(paths.filter((p): p is string => !!p));
}

/**
 * Orphan sweep: deletes storage files that nothing in the database points
 * to. Files younger than an hour are left alone, because an upload may be
 * mid-save right now.
 */
export async function sweepOrphanFiles(): Promise<ActionResult> {
  await requireAdmin();
  const db = createServiceClient();
  const cutoff = Date.now() - 60 * 60 * 1000;
  let removed = 0;
  try {
    const used = await referencedPaths(db);
    for (const bucket of [BUCKETS.covers, BUCKETS.previews, BUCKETS.media] as const) {
      const all = await listAllObjects(bucket);
      const orphans = all.filter((o) => !used.has(o.path) && (!o.createdAt || Date.parse(o.createdAt) < cutoff)).map((o) => o.path);
      await removeFiles(bucket, orphans);
      removed += orphans.length;
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not list storage.");
  }
  return { ok: true, message: removed ? `Removed ${removed} unused files.` : "No unused files. Storage is clean." };
}
