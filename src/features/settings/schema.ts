import { z } from "zod";

/** Placeholders the shop owner can use in WhatsApp templates and order steps. */
export const TEMPLATE_TOKENS = {
  title: "[Book Title]",
  id: "[Book ID]",
  price: "[Price]",
  url: "[Site URL]",
  list: "[Book List]",
  total: "[Total]",
  responseTime: "[Response time]",
} as const;

/** A link is either a path on this site ("/shop") or a full https URL. */
export const linkUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\/\S+$/i.test(v), "Use a path like /shop or a full https:// link");

export const faqItemSchema = z.object({
  q: z.string().trim().min(1, "Write the question").max(200),
  a: z.string().trim().min(1, "Write the answer").max(2000),
});

export const stepSchema = z.object({
  title: z.string().trim().min(1, "Give the step a title").max(80),
  body: z.string().trim().max(300),
});

export const linkSchema = z.object({
  label: z.string().trim().min(1, "Add a label").max(40),
  url: linkUrl.refine((v) => v !== "", "Add a link"),
});

export const footerColumnSchema = z.object({
  title: z.string().trim().min(1).max(40),
  links: z.array(linkSchema).max(10),
});

export const paymentMethodSchema = z.object({
  label: z.string().trim().min(1).max(30),
  number: z.string().trim().max(30),
  note: z.string().trim().max(60),
});

export const HOME_SECTION_TYPES = {
  hero: "Banner carousel",
  categories: "Category shortcuts",
  offers: "Offers",
  newest: "Newest book",
  best_selling: "Best selling row",
  latest: "New arrivals row",
  collections: "Collection rows",
  collection_tiles: "Collection tiles",
  recent: "Recently viewed",
  journey: "How to order steps",
  faq: "FAQ",
} as const;
export type HomeSectionType = keyof typeof HOME_SECTION_TYPES;

export const homeSectionSchema = z.object({
  type: z.enum(Object.keys(HOME_SECTION_TYPES) as [HomeSectionType, ...HomeSectionType[]]),
  enabled: z.boolean(),
});

const verification = z
  .string()
  .trim()
  .max(200)
  // People paste the whole "google-site-verification=..." string; keep only the code.
  .transform((v) => v.replace(/^.*?(site-verification|msvalidate\.01)\s*[=:]\s*/i, "").replace(/["'<>]/g, "").trim());

export const generalSettingsSchema = z.object({
  site_name: z.string().trim().min(1).max(40),
  tagline: z.string().trim().max(80),
  currency_symbol: z.string().trim().min(1).max(4),
  whatsapp_number: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d]/g, ""))
    .refine((v) => v === "" || /^\d{8,15}$/.test(v), "Digits with country code, e.g. 8801712345678"),
  whatsapp_template: z
    .string()
    .trim()
    .min(10)
    .max(1000)
    .refine((v) => v.includes(TEMPLATE_TOKENS.title), `Must include ${TEMPLATE_TOKENS.title}`),
  whatsapp_list_template: z
    .string()
    .trim()
    .min(10)
    .max(1000)
    .refine((v) => v.includes(TEMPLATE_TOKENS.list), `Must include ${TEMPLATE_TOKENS.list}`),
  response_time: z.string().trim().min(1).max(40),
  delivery_note: z.string().trim().max(120),
  announcement: z.string().trim().max(160),
  announcement_link: linkUrl,
  announcement_active: z.boolean(),
  announcement_dismissible: z.boolean(),
  payment_methods: z.array(paymentMethodSchema).max(6),
  how_to_buy_steps: z.array(stepSchema).min(1, "Keep at least one step").max(8),
});

export const navigationSchema = z.object({
  header_links: z.array(linkSchema).max(8),
  footer_columns: z.array(footerColumnSchema).max(5),
  social_links: z.array(linkSchema).max(8),
});

export const homeLayoutSchema = z.object({
  home_sections: z.array(homeSectionSchema).max(20),
});

export const pagesContentSchema = z.object({
  about_content: z.string().max(40000),
  terms_content: z.string().max(60000),
  how_to_order_content: z.string().max(40000),
  faq_items: z.array(faqItemSchema).max(40),
});

export const seoSettingsSchema = z.object({
  title_template: z
    .string()
    .trim()
    .max(80)
    .refine((v) => v.includes("%s"), "Must include %s where the page title goes"),
  default_meta_description: z.string().trim().max(200),
  default_keywords: z.array(z.string().trim().min(1).max(60)).max(30),
  site_noindex: z.boolean(),
  google_verification: verification,
  bing_verification: verification,
});

export type FaqItem = z.infer<typeof faqItemSchema>;
export type Step = z.infer<typeof stepSchema>;
export type NavLink = z.infer<typeof linkSchema>;
export type FooterColumn = z.infer<typeof footerColumnSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type HomeSection = z.infer<typeof homeSectionSchema>;

export type SiteSettings = z.infer<typeof generalSettingsSchema> &
  z.infer<typeof navigationSchema> &
  z.infer<typeof homeLayoutSchema> &
  z.infer<typeof pagesContentSchema> &
  z.infer<typeof seoSettingsSchema> & {
    default_og_image_path: string | null;
  };
