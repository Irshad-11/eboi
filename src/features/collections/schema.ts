import { z } from "zod";
import { AUTO_COLLECTION_SLUGS } from "@/config/site";
import { SLUG_PATTERN } from "@/lib/slug";
import { seoRowSchema } from "@/features/seo/schema";

export const collectionInputSchema = z
  .object({
    name: z.string().trim().min(2, "At least 2 characters").max(80),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(SLUG_PATTERN, "Lowercase letters, numbers and dashes")
      .max(80)
      .refine((s) => !(AUTO_COLLECTION_SLUGS as string[]).includes(s), "This slug is used by an automatic collection"),
    description: z.string().max(40000).default(""),
    editorial_intro: z.string().trim().max(600).default(""),
    mood: z.enum(["paper", "forest", "ink"]).default("paper"),
    sort_order: z.coerce.number().int().min(-1000).max(1000).default(0),
    show_on_home: z.boolean().default(true),
    show_in_nav: z.boolean().default(false),
    image_path: z.string().max(1000).nullable().default(null),
  })
  .and(seoRowSchema);

export type CollectionInput = z.output<typeof collectionInputSchema>;
export type CollectionFormValues = z.input<typeof collectionInputSchema>;
