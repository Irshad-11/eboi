import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { BannerRow } from "@/lib/supabase/database.types";

export type Banner = Pick<
  BannerRow,
  "id" | "title" | "subtitle" | "button_label" | "link_url" | "alt_text" | "bg_color" | "text_color" | "image_desktop_path" | "image_mobile_path"
>;

/** Live slides in order. RLS already hides inactive and out-of-schedule rows. */
export const getBanners = cache(async (): Promise<Banner[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("banners")
    .select("id, title, subtitle, button_label, link_url, alt_text, bg_color, text_color, image_desktop_path, image_mobile_path, start_at, end_at, is_active")
    .order("sort_order")
    .order("created_at");
  if (error) {
    console.error("[banners] read failed:", error.message);
    return [];
  }
  const now = Date.now();
  return (data ?? [])
    .filter((b) => b.is_active && (!b.start_at || Date.parse(b.start_at) <= now) && (!b.end_at || Date.parse(b.end_at) > now))
    .map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      button_label: b.button_label,
      link_url: b.link_url,
      alt_text: b.alt_text,
      bg_color: b.bg_color,
      text_color: b.text_color,
      image_desktop_path: b.image_desktop_path,
      image_mobile_path: b.image_mobile_path,
    }));
});
