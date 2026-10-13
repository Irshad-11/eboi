import { z } from "zod";

/** SEO fields stored on books, collections and fixed pages. */
export const seoRowSchema = z.object({
  seo_title: z.string().trim().max(70).nullish().transform((v) => v || null),
  seo_description: z.string().trim().max(200).nullish().transform((v) => v || null),
  focus_keyword: z.string().trim().max(60).nullish().transform((v) => v || null),
  seo_keywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  canonical_url: z
    .string()
    .trim()
    .max(300)
    .nullish()
    .transform((v) => v || null)
    .refine((v) => v === null || v.startsWith("/") || /^https?:\/\/\S+$/i.test(v), "Use a path like /shop or a full https:// URL"),
  noindex: z.boolean().default(false),
  og_image_path: z.string().max(1000).nullish().transform((v) => v || null),
});

export type SeoRow = z.output<typeof seoRowSchema>;
