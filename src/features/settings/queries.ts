import "server-only";
import { cache } from "react";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { DEFAULT_FEATURES, DEFAULT_HOME_SECTIONS, DEFAULT_SETTINGS } from "./defaults";
import {
  faqItemSchema,
  footerColumnSchema,
  homeSectionSchema,
  linkSchema,
  paymentMethodSchema,
  POPUP_FREQUENCIES,
  stepSchema,
  type FeatureFlags,
  type HomeSection,
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
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const color = (v: unknown, fallback: string) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback);
const nullableStr = (v: unknown) => (typeof v === "string" && v ? v : null);

/** Saved flags win; flags added in a later version start at their default. */
function features(v: unknown): FeatureFlags {
  const saved = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  return Object.fromEntries(Object.entries(DEFAULT_FEATURES).map(([k, d]) => [k, typeof saved[k] === "boolean" ? saved[k] : d])) as FeatureFlags;
}

/** Saved order wins; a section type added in a later version is slotted in at its default place. */
function mergeSections(saved: HomeSection[]): HomeSection[] {
  if (!saved.length) return DEFAULT_HOME_SECTIONS;
  const out = [...saved];
  DEFAULT_HOME_SECTIONS.forEach((def, i) => {
    if (out.some((s) => s.type === def.type)) return;
    const before = DEFAULT_HOME_SECTIONS.slice(0, i).reverse().find((d) => out.some((s) => s.type === d.type));
    const at = before ? out.findIndex((s) => s.type === before.type) + 1 : 0;
    out.splice(at, 0, def);
  });
  return out;
}

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
    announcement_bg: color(d.announcement_bg, D.announcement_bg),
    announcement_fg: color(d.announcement_fg, D.announcement_fg),
    announcement_image: nullableStr(d.announcement_image),
    hero_interval: num(d.hero_interval, D.hero_interval),
    popup_enabled: bool(d.popup_enabled, false),
    popup_title: str(d.popup_title, ""),
    popup_body: str(d.popup_body, ""),
    popup_image: nullableStr(d.popup_image),
    popup_button_label: str(d.popup_button_label, ""),
    popup_link: str(d.popup_link, ""),
    popup_show_latest: bool(d.popup_show_latest, true),
    popup_delay: num(d.popup_delay, D.popup_delay),
    popup_autoclose: num(d.popup_autoclose, 0),
    popup_frequency: typeof d.popup_frequency === "string" && d.popup_frequency in POPUP_FREQUENCIES ? (d.popup_frequency as keyof typeof POPUP_FREQUENCIES) : "session",
    popup_version: num(d.popup_version, 0),
    features: features(d.features),
    trending_searches: Array.isArray(d.trending_searches) ? (d.trending_searches as unknown[]).filter((t): t is string => typeof t === "string") : [],
    payment_methods: parseList(paymentMethodSchema, d.payment_methods, D.payment_methods),
    how_to_buy_steps: parseList(stepSchema, d.how_to_buy_steps, D.how_to_buy_steps),
    header_links: parseList(linkSchema, d.header_links),
    footer_columns: parseList(footerColumnSchema, d.footer_columns, D.footer_columns),
    social_links: parseList(linkSchema, d.social_links),
    home_sections: mergeSections(sections),
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
  | "features"
  | "trending_searches"
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
    features: s.features,
    trending_searches: s.trending_searches,
  };
}
