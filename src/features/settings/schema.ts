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
  trust: "Why buy here (4 promises)",
  categories: "Category shortcuts",
  offers: "Offers",
  newest: "Newest book",
  best_selling: "Best selling row",
  latest: "New arrivals row",
  collections: "Collection rows",
  collection_tiles: "Collection tiles",
  recent: "Recently viewed",
  stats: "Shop in numbers (sold, readers, rating)",
  testimonials: "What readers say (reviews)",
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
  payment_methods: z.array(paymentMethodSchema).max(6),
  how_to_buy_steps: z.array(stepSchema).min(1, "Keep at least one step").max(8),
});

/**
 * Optional storefront features, each switchable in Admin > Notices and
 * features. Picked from common book-shop patterns (Amazon, Rokomari, Kobo
 * and conversion research) that fit a WhatsApp PDF shop; social proof uses
 * real numbers only.
 */
export const FEATURES = {
  sold_count: { label: "How many sold", hint: "“418 sold” on book cards and book pages", default: true },
  category_rank: { label: "Bestseller rank", hint: "“#1 in Business” on the book page", default: true },
  bundle: { label: "Buy together", hint: "The book plus two related books in one WhatsApp order, on the book page", default: true },
  more_by_author: { label: "More by this author", hint: "A row on the book page", default: true },
  tag_chips: { label: "Topic tags", hint: "Clickable tags on the book page", default: true },
  trending_searches: { label: "Popular searches", hint: "Shown when someone opens the empty search box", default: true },
  card_quick_actions: { label: "Quick preview and heart on cards", hint: "Appear on hover (always on phones)", default: true },
  recent_sales_toast: { label: "Recent order notices", hint: "A small notice like “Freelance Taka was ordered 2 hours ago”, from your sales log, never with names", default: false },
  floating_whatsapp: { label: "Floating WhatsApp button", hint: "Bottom corner of every page", default: true },
  back_to_top: { label: "Back to top button", hint: "Appears after scrolling down", default: true },
} as const;
export type FeatureKey = keyof typeof FEATURES;
export type FeatureFlags = Record<FeatureKey, boolean>;

const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #d42d2d");
/** An image setting: an uploaded file path or a full https link (GIF allowed). */
const imageRef = z.string().trim().max(1000).nullable();

export const POPUP_FREQUENCIES = { session: "Once per visit", day: "Once a day", always: "Every page load" } as const;

export const storefrontSchema = z.object({
  announcement: z.string().trim().max(160),
  announcement_link: linkUrl,
  announcement_active: z.boolean(),
  announcement_dismissible: z.boolean(),
  announcement_bg: hex,
  announcement_fg: hex,
  announcement_image: imageRef,
  hero_interval: z.coerce.number().int().min(0).max(30),
  popup_enabled: z.boolean(),
  popup_title: z.string().trim().max(80),
  popup_body: z.string().trim().max(300),
  popup_image: imageRef,
  popup_button_label: z.string().trim().max(40),
  popup_link: linkUrl,
  popup_show_latest: z.boolean(),
  popup_delay: z.coerce.number().int().min(0).max(60),
  popup_autoclose: z.coerce.number().int().min(0).max(120),
  popup_frequency: z.enum(Object.keys(POPUP_FREQUENCIES) as [keyof typeof POPUP_FREQUENCIES, ...(keyof typeof POPUP_FREQUENCIES)[]]),
  features: z.record(z.string(), z.boolean()),
  trending_searches: z.array(z.string().trim().min(1).max(40)).max(10),
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

export type StorefrontSettings = Omit<z.infer<typeof storefrontSchema>, "features"> & {
  features: FeatureFlags;
  /** Changes on every save, so an edited pop-up shows again. */
  popup_version: number;
};

export type SiteSettings = z.infer<typeof generalSettingsSchema> &
  StorefrontSettings &
  z.infer<typeof navigationSchema> &
  z.infer<typeof homeLayoutSchema> &
  z.infer<typeof pagesContentSchema> &
  z.infer<typeof seoSettingsSchema> & {
    default_og_image_path: string | null;
  };
