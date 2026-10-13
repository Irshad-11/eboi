"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BUCKETS, MEDIA_FOLDERS } from "@/config/storage";
import { linkUrl } from "@/features/settings/schema";
import { createSessionClient } from "@/lib/supabase/server";
import { requireAdmin } from "../auth";
import { belongsToMedia } from "../paths";
import { checkNewMedia, removeFiles } from "../storage.server";
import { dbError, fail, zodFieldErrors, type ActionResult } from "../action-result";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #1d5c42");

const bannerSchema = z
  .object({
    title: z.string().trim().max(120),
    subtitle: z.string().trim().max(200),
    button_label: z.string().trim().max(40),
    link_url: linkUrl,
    alt_text: z.string().trim().max(200),
    bg_color: hex,
    text_color: hex,
    image_desktop_path: z.string().max(200).nullable(),
    image_mobile_path: z.string().max(200).nullable(),
    is_active: z.boolean(),
    start_at: z.iso.datetime({ offset: true }).nullable(),
    end_at: z.iso.datetime({ offset: true }).nullable(),
  })
  .refine((b) => b.image_desktop_path || b.image_mobile_path || b.title, { path: ["title"], message: "Add an image or a title" })
  .refine((b) => !(b.image_desktop_path || b.image_mobile_path) || b.alt_text, { path: ["alt_text"], message: "Describe the image for screen readers and Google" })
  .refine((b) => !b.end_at || !b.start_at || Date.parse(b.end_at) > Date.parse(b.start_at), { path: ["end_at"], message: "End must be after start" });

export type BannerInput = z.input<typeof bannerSchema>;

export async function saveBanner(id: string, isNew: boolean, values: BannerInput): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return fail("Unknown banner.");
  const parsed = bannerSchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  const supabase = await createSessionClient();
  const { data: old } = await supabase.from("banners").select("image_desktop_path, image_mobile_path").eq("id", id).maybeSingle();
  const own = (p: string) => belongsToMedia(p, MEDIA_FOLDERS.banners, id);
  for (const key of ["image_desktop_path", "image_mobile_path"] as const) {
    const p = parsed.data[key];
    if (p && p !== old?.[key]) {
      const msg = await checkNewMedia(p, own);
      if (msg) return fail(msg, { [key]: msg });
    }
  }
  let error;
  if (isNew || !old) {
    const { data: last } = await supabase.from("banners").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    ({ error } = await supabase.from("banners").insert({ id, ...parsed.data, sort_order: (last?.sort_order ?? 0) + 1 }));
  } else {
    ({ error } = await supabase.from("banners").update(parsed.data).eq("id", id));
  }
  if (error) return fail(dbError(error));
  if (old) {
    await removeFiles(BUCKETS.media, [
      old.image_desktop_path !== parsed.data.image_desktop_path ? old.image_desktop_path : null,
      old.image_mobile_path !== parsed.data.image_mobile_path ? old.image_mobile_path : null,
    ]);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Banner saved." };
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data: old } = await supabase.from("banners").select("image_desktop_path, image_mobile_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return fail(dbError(error, "delete"));
  await removeFiles(BUCKETS.media, [old?.image_desktop_path, old?.image_mobile_path]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Banner deleted." };
}

export async function reorderBanners(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.array(z.uuid()).max(100).safeParse(ids);
  if (!parsed.success) return fail("Invalid order.");
  const supabase = await createSessionClient();
  for (const [i, bid] of parsed.data.entries()) {
    const { error } = await supabase.from("banners").update({ sort_order: i + 1 }).eq("id", bid);
    if (error) return fail(dbError(error));
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Order saved." };
}
