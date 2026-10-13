import "server-only";
import { cache } from "react";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { DEFAULT_HOME_SECTIONS, DEFAULT_SETTINGS } from "./defaults";
import {
  faqItemSchema,
  footerColumnSchema,
  homeSectionSchema,
  linkSchema,
  paymentMethodSchema,
  stepSchema,
  TEMPLATE_TOKENS,
  type SiteSettings,
} from "./schema";

/** jsonb lists are parsed leniently: one bad item should not blank a page. */
function parseList<T>(schema: z.ZodType<T>, value: unknown, fallback: T[] = []): T[] {
  if (!Array.isArray(value)) return fallback;
  return value.flatMap((item) => {
    const r = schema.safeParse(item);
    return r.success ? [r.data] : [];
  });
}

const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

/** Site settings, read once per request (React cache dedupes callers). */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  const { data, error } = await createPublicClient().from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) {
    if (error) console.error("[settings] read failed:", error.message);
    return DEFAULT_SETTINGS;
  }
  // Columns added by update-01 may be missing if that SQL was not run yet.
  const d = data as Partial<typeof data> & Record<string, unknown>;
  const D = DEFAULT_SETTINGS;
  const sections = parseList(homeSectionSchema, d.home_sections, DEFAULT_HOME_SECTIONS);
  return {
    site_name: str(d.site_name, D.site_name),
    tagline: str(d.tagline, D.tagline),
    currency_symbol: str(d.currency_symbol, "") || D.currency_symbol,
    whatsapp_number: str(d.whatsapp_number, ""),
    whatsapp_template: str(d.whatsapp_template, D.whatsapp_template),
    whatsapp_list_template: str(d.whatsapp_list_template, D.whatsapp_list_template),
    response_time: str(d.response_time, D.response_time),
    delivery_note: str(d.delivery_note, D.delivery_note),
    announcement: str(d.announcement, ""),
    announcement_link: str(d.announcement_link, ""),
    announcement_active: bool(d.announcement_active, false),
    announcement_dismissible: bool(d.announcement_dismissible, true),
    payment_methods: parseList(paymentMethodSchema, d.payment_methods, D.payment_methods),
    how_to_buy_steps: parseList(stepSchema, d.how_to_buy_steps, D.how_to_buy_steps),
    header_links: parseList(linkSchema, d.header_links),
    footer_columns: parseList(footerColumnSchema, d.footer_columns, D.footer_columns),
    social_links: parseList(linkSchema, d.social_links),
    home_sections: sections.length ? sections : DEFAULT_HOME_SECTIONS,
    about_content: str(d.about_content, ""),
    terms_content: str(d.terms_content, ""),
    how_to_order_content: str(d.how_to_order_content, ""),
    faq_items: parseList(faqItemSchema, d.faq_items),
    title_template: str(d.title_template, "") || D.title_template,
    default_meta_description: str(d.default_meta_description, "") || D.default_meta_description,
    default_keywords: Array.isArray(d.default_keywords) ? (d.default_keywords as string[]) : D.default_keywords,
    default_og_image_path: typeof d.default_og_image_path === "string" ? d.default_og_image_path : null,
    site_noindex: bool(d.site_noindex, false),
    google_verification: str(d.google_verification, D.google_verification),
    bing_verification: str(d.bing_verification, ""),
  };
});

/** Fills [Response time] in order steps and similar copy. */
export function fillTokens(text: string, s: Pick<SiteSettings, "response_time">): string {
  return text.split(TEMPLATE_TOKENS.responseTime).join(s.response_time);
}

/** The subset the browser needs for WhatsApp messages, prices and the order dialog. */
export type ClientSettings = Pick<
  SiteSettings,
  | "whatsapp_number"
  | "whatsapp_template"
  | "whatsapp_list_template"
  | "currency_symbol"
  | "delivery_note"
  | "response_time"
  | "how_to_buy_steps"
>;

export function toClientSettings(s: SiteSettings): ClientSettings {
  return {
    whatsapp_number: s.whatsapp_number,
    whatsapp_template: s.whatsapp_template,
    whatsapp_list_template: s.whatsapp_list_template,
    currency_symbol: s.currency_symbol,
    delivery_note: s.delivery_note,
    response_time: s.response_time,
    how_to_buy_steps: s.how_to_buy_steps.map((st) => ({ title: fillTokens(st.title, s), body: fillTokens(st.body, s) })),
  };
}
