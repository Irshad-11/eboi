"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BUCKETS, MEDIA_FOLDERS } from "@/config/storage";
import { sanitizeRichText } from "@/lib/rich-text";
import { createSessionClient } from "@/lib/supabase/server";
import type { PageKey, SiteSettingsRow } from "@/lib/supabase/database.types";
import {
  generalSettingsSchema,
  homeLayoutSchema,
  navigationSchema,
  pagesContentSchema,
  seoSettingsSchema,
} from "@/features/settings/schema";
import { seoRowSchema } from "@/features/seo/schema";
import { requireAdmin } from "../auth";
import { belongsToMedia } from "../paths";
import { PAGE_MEDIA_OWNER, SITE_MEDIA_OWNER } from "../media-owners";
import { checkNewMedia, removeFiles } from "../storage.server";
import { dbError, fail, zodFieldErrors, type ActionResult } from "../action-result";

async function update(row: Partial<SiteSettingsRow>): Promise<ActionResult> {
  const supabase = await createSessionClient();
  const { error } = await supabase.from("site_settings").update(row).eq("id", 1);
  if (error) return fail(dbError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved. The store updates right away." };
}

export async function saveGeneralSettings(values: z.input<typeof generalSettingsSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = generalSettingsSchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  return update(parsed.data);
}

export async function saveNavigation(values: z.input<typeof navigationSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = navigationSchema.safeParse(values);
  if (!parsed.success) return fail("Some links need fixing.", zodFieldErrors(parsed.error));
  return update(parsed.data);
}

export async function saveHomeLayout(values: z.input<typeof homeLayoutSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = homeLayoutSchema.safeParse(values);
  if (!parsed.success) return fail("The layout is not valid.");
  return update(parsed.data);
}

export async function savePagesContent(values: z.input<typeof pagesContentSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = pagesContentSchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  return update({
    ...parsed.data,
    about_content: sanitizeRichText(parsed.data.about_content),
    terms_content: sanitizeRichText(parsed.data.terms_content),
    how_to_order_content: sanitizeRichText(parsed.data.how_to_order_content),
  });
}

export async function saveSeoSettings(values: z.input<typeof seoSettingsSchema> & { default_og_image_path: string | null }): Promise<ActionResult> {
  await requireAdmin();
  const parsed = seoSettingsSchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  const supabase = await createSessionClient();
  const { data: old } = await supabase.from("site_settings").select("default_og_image_path").eq("id", 1).maybeSingle();
  const og = values.default_og_image_path ?? null;
  if (og && og !== old?.default_og_image_path) {
    const msg = await checkNewMedia(og, (p) => belongsToMedia(p, MEDIA_FOLDERS.seo, SITE_MEDIA_OWNER));
    if (msg) return fail(msg, { default_og_image_path: msg });
  }
  const res = await update({ ...parsed.data, default_og_image_path: og });
  if (res.ok && old?.default_og_image_path && old.default_og_image_path !== og) await removeFiles(BUCKETS.media, [old.default_og_image_path]);
  return res;
}

const PAGE_KEYS = ["home", "shop", "about", "how-to-order", "faq", "terms"] as const;

export async function savePageSeo(key: PageKey, values: z.input<typeof seoRowSchema>): Promise<ActionResult> {
  await requireAdmin();
  if (!(PAGE_KEYS as readonly string[]).includes(key)) return fail("Unknown page.");
  const parsed = seoRowSchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  const supabase = await createSessionClient();
  const { data: old } = await supabase.from("page_seo").select("og_image_path").eq("page_key", key).maybeSingle();
  const og = parsed.data.og_image_path;
  if (og && og !== old?.og_image_path) {
    const msg = await checkNewMedia(og, (p) => belongsToMedia(p, MEDIA_FOLDERS.seo, PAGE_MEDIA_OWNER[key]));
    if (msg) return fail(msg, { og_image_path: msg });
  }
  const { error } = await supabase.from("page_seo").upsert({ page_key: key, ...parsed.data });
  if (error) return fail(dbError(error));
  if (old?.og_image_path && old.og_image_path !== og) await removeFiles(BUCKETS.media, [old.og_image_path]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

const redirectSchema = z.object({
  source_path: z
    .string()
    .trim()
    .regex(/^\/[^\s?#]*$/, "Start with / and leave out spaces, ? and #")
    .max(300)
    .refine((p) => !/^\/(admin|api|_next)(\/|$)/.test(p), "Admin and system paths cannot be redirected"),
  destination: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine((v) => v.startsWith("/") || /^https?:\/\/\S+$/i.test(v), "Use a path like /shop or a full https:// URL"),
  status_code: z.union([z.literal(301), z.literal(302)]).default(301),
  is_active: z.boolean().default(true),
});

export async function saveRedirect(id: string | null, values: z.input<typeof redirectSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = redirectSchema.safeParse(values);
  if (!parsed.success) return fail("Check the redirect.", zodFieldErrors(parsed.error));
  if (parsed.data.source_path.replace(/\/+$/, "") === parsed.data.destination.replace(/\/+$/, "")) return fail("A page cannot redirect to itself.");
  const supabase = await createSessionClient();
  const { error } = id ? await supabase.from("redirects").update(parsed.data).eq("id", id) : await supabase.from("redirects").insert(parsed.data);
  if (error) return fail(error.code === "23505" ? "There is already a redirect from this path." : dbError(error));
  return { ok: true, message: "Redirect saved. It is live within a minute." };
}

export async function deleteRedirect(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("redirects").delete().eq("id", id);
  if (error) return fail(dbError(error, "delete"));
  return { ok: true, message: "Redirect deleted." };
}
