import "server-only";
import { cache } from "react";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { DEFAULT_SETTINGS } from "./defaults";
import { faqItemSchema, howToBuyStepSchema, socialLinkSchema, type SiteSettings } from "./schema";

/** jsonb columns are parsed leniently: one bad item should not blank a page. */
function parseList<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const r = schema.safeParse(item);
    return r.success ? [r.data] : [];
  });
}

/** Site settings, read once per request (React cache dedupes callers). */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  const { data, error } = await createPublicClient().from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) {
    if (error) console.error("[settings] read failed:", error.message);
    return DEFAULT_SETTINGS;
  }
  return {
    site_name: data.site_name,
    tagline: data.tagline,
    whatsapp_number: data.whatsapp_number,
    whatsapp_template: data.whatsapp_template,
    whatsapp_list_template: data.whatsapp_list_template,
    currency_symbol: data.currency_symbol || DEFAULT_SETTINGS.currency_symbol,
    announcement: data.announcement,
    announcement_active: data.announcement_active,
    delivery_note: data.delivery_note,
    about_content: data.about_content,
    terms_content: data.terms_content,
    faq_items: parseList(faqItemSchema, data.faq_items),
    how_to_buy_steps: parseList(howToBuyStepSchema, data.how_to_buy_steps),
    social_links: parseList(socialLinkSchema, data.social_links),
  };
});

/** The subset the browser needs for WhatsApp messages and price display. */
export type ClientSettings = Pick<
  SiteSettings,
  "whatsapp_number" | "whatsapp_template" | "whatsapp_list_template" | "currency_symbol" | "delivery_note"
>;

export function toClientSettings(s: SiteSettings): ClientSettings {
  return {
    whatsapp_number: s.whatsapp_number,
    whatsapp_template: s.whatsapp_template,
    whatsapp_list_template: s.whatsapp_list_template,
    currency_symbol: s.currency_symbol,
    delivery_note: s.delivery_note,
  };
}
