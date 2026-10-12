import { z } from "zod";
import { AUTO_COLLECTION_SLUGS } from "@/config/site";
import { SLUG_PATTERN } from "@/lib/slug";

export const collectionInputSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SLUG_PATTERN, "Lowercase letters, numbers and single dashes")
    .max(80)
    .refine((s) => !(AUTO_COLLECTION_SLUGS as string[]).includes(s), "This slug is reserved for an automatic collection"),
  description: z.string().trim().max(4000).default(""),
  editorial_intro: z.string().trim().max(600).default(""),
  mood: z.enum(["paper", "forest", "ink"]).default("paper"),
  sort_order: z.coerce.number().int().min(-1000).max(1000).default(0),
  show_on_home: z.boolean().default(true),
});

export type CollectionInput = z.output<typeof collectionInputSchema>;
export type CollectionFormValues = z.input<typeof collectionInputSchema>;
