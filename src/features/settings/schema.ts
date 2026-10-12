import { z } from "zod";

/** Placeholders the shop owner can use in WhatsApp templates. */
export const TEMPLATE_TOKENS = {
  title: "[Book Title]",
  id: "[Book ID]",
  price: "[Price]",
  url: "[Site URL]",
  list: "[Book List]",
  total: "[Total]",
} as const;

export const faqItemSchema = z.object({
  q: z.string().trim().min(1, "Write the question").max(200),
  a: z.string().trim().min(1, "Write the answer").max(2000),
});

export const howToBuyStepSchema = z.object({
  title: z.string().trim().min(1, "Give the step a title").max(80),
  body: z.string().trim().max(400),
});

export const socialLinkSchema = z.object({
  label: z.string().trim().min(1).max(40),
  url: z.url({ message: "Use a full link starting with https://" }).max(300),
});

export const generalSettingsSchema = z.object({
  site_name: z.string().trim().min(1).max(40),
  tagline: z.string().trim().min(1).max(80),
  whatsapp_number: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d]/g, ""))
    .refine((v) => v === "" || /^\d{8,15}$/.test(v), "Digits only, with country code, e.g. 8801712345678"),
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
  currency_symbol: z.string().trim().min(1).max(4),
  announcement: z.string().trim().max(160),
  announcement_active: z.boolean(),
  delivery_note: z.string().trim().max(300),
  social_links: z.array(socialLinkSchema).max(8),
});

export const pagesContentSchema = z.object({
  about_content: z.string().trim().max(10000),
  terms_content: z.string().trim().max(20000),
  faq_items: z.array(faqItemSchema).max(40),
  how_to_buy_steps: z.array(howToBuyStepSchema).min(1, "Keep at least one step").max(8),
});

export type FaqItem = z.infer<typeof faqItemSchema>;
export type HowToBuyStep = z.infer<typeof howToBuyStepSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type GeneralSettingsInput = z.input<typeof generalSettingsSchema>;
export type PagesContentInput = z.input<typeof pagesContentSchema>;

export type SiteSettings = z.infer<typeof generalSettingsSchema> & z.infer<typeof pagesContentSchema>;
