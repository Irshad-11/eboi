import { z } from "zod";
import { TEXT } from "@/config/limits";
import { SLUG_PATTERN } from "@/lib/slug";

/**
 * One schema for every way a book enters the system: the admin form, the
 * JSON import and the demo seed. If it passes here, the database will accept
 * it (the SQL CHECK constraints mirror these rules).
 */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const money = z.coerce.number().min(0, "Cannot be negative").max(100000);

const stringList = (itemMax: number, listMax: number) =>
  z
    .array(z.string().trim().max(itemMax))
    .max(listMax)
    .transform((list) => [...new Set(list.filter(Boolean))]);

export const bookInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(TEXT.titleMax),
    subtitle: optionalText(TEXT.subtitleMax),
    slug: z.string().trim().toLowerCase().regex(SLUG_PATTERN, "Lowercase letters, numbers and single dashes only").max(120),
    author: z.string().trim().max(120).default(""),
    category: z.string().trim().min(1, "Pick or type a category").max(60).default("General"),
    tags: stringList(40, TEXT.tagsMax).default([]),
    language: z.string().trim().min(1).max(40).default("English"),
    page_count: z.coerce.number().int().positive().max(20000).nullish().transform((v) => v ?? null),
    format: z.string().trim().min(1).max(30).default("PDF"),
    file_size: optionalText(30),
    // HTML from the rich text editor (plain text is accepted too).
    description: z.string().trim().max(TEXT.descriptionMax).default(""),
    highlights: stringList(TEXT.highlightMax, TEXT.highlightsMax).default([]),
    table_of_contents: z.string().trim().max(TEXT.tocMax).default(""),
    price: money,
    old_price: money.nullish().transform((v) => v ?? null),
    offer_id: z.uuid().nullish().transform((v) => v ?? null),
    rating: z.coerce.number().min(0).max(5).default(0),
    rating_count: z.coerce.number().int().min(0).default(0),
    total_sells: z.coerce.number().int().min(0).default(0),
    views: z.coerce.number().int().min(0).default(0),
    release_date: z.iso.date().nullish().transform((v) => v ?? null),
    is_featured: z.boolean().default(false),
    status: z.enum(["draft", "published"]).default("draft"),
    badge: z.enum(["none", "new", "bestseller"]).default("none"),
    seo_title: optionalText(70),
    seo_description: optionalText(200),
    focus_keyword: optionalText(60),
    seo_keywords: stringList(60, 20).default([]),
    canonical_url: optionalText(300).refine((v) => v === null || v.startsWith("/") || /^https?:\/\/\S+$/i.test(v), "Use a path or a full https:// URL"),
    noindex: z.boolean().default(false),
    cover_alt: optionalText(200),
    internal_file_note: optionalText(300),
  })
  .refine((b) => b.old_price == null || b.old_price > b.price, {
    path: ["old_price"],
    message: "Old price should be higher than the price (or empty)",
  });

export type BookInput = z.output<typeof bookInputSchema>;
export type BookFormValues = z.input<typeof bookInputSchema>;

/**
 * JSON import/export format (version 1). Documented in docs/BOOK_JSON.md and
 * as JSON Schema in public/book-import.schema.json.
 */
export const bookJsonSchema = z
  .object({
    $schema: z.string().optional(),
    format_version: z.literal(1).default(1),
    book_code: z
      .string()
      .trim()
      .regex(/^EB-\d{4,}$/, "Book codes look like EB-0001")
      .optional(),
    collections: z.array(z.string().trim().regex(SLUG_PATTERN)).max(20).default([]),
    files: z
      .object({
        cover: z.string().max(200).optional(),
        preview: z.string().max(200).optional(),
      })
      .optional(),
    /** Customer reviews. Leave out to keep a book's existing reviews. */
    reviews: z
      .array(
        z.object({
          author_name: z.string().trim().min(1).max(80),
          rating: z.coerce.number().int().min(1).max(5),
          body: z.string().trim().max(1500).default(""),
          review_date: z.iso.date(),
          is_visible: z.boolean().default(true),
        }),
      )
      .max(50)
      .optional(),
  })
  .and(bookInputSchema);

export type BookJson = z.output<typeof bookJsonSchema>;
