import { z } from "zod";

export const offerInputSchema = z
  .object({
    title: z.string().trim().min(2).max(80),
    banner_text: z.string().trim().max(160).default(""),
    discount_type: z.enum(["percent", "fixed"]),
    value: z.coerce.number().positive("Must be more than 0").max(100000),
    applies_to: z.enum(["all", "books", "collections"]),
    start_at: z.iso.datetime({ offset: true }),
    end_at: z.iso.datetime({ offset: true }).nullable(),
    show_countdown: z.boolean().default(false),
    is_active: z.boolean().default(true),
    bookIds: z.array(z.uuid()).max(500).default([]),
    collectionIds: z.array(z.uuid()).max(50).default([]),
  })
  .refine((o) => o.discount_type !== "percent" || o.value <= 90, { path: ["value"], message: "Percent offers go up to 90%" })
  .refine((o) => !o.end_at || Date.parse(o.end_at) > Date.parse(o.start_at), { path: ["end_at"], message: "End must be after start" })
  .refine((o) => o.applies_to !== "books" || o.bookIds.length > 0, { path: ["bookIds"], message: "Pick at least one book" })
  .refine((o) => o.applies_to !== "collections" || o.collectionIds.length > 0, { path: ["collectionIds"], message: "Pick at least one collection" })
  .refine((o) => !o.show_countdown || o.end_at, { path: ["show_countdown"], message: "A countdown needs an end date" });

export type OfferFormValues = z.input<typeof offerInputSchema>;

export type OfferStatus = "live" | "scheduled" | "ended" | "off";

export function offerStatus(o: { is_active: boolean; start_at: string; end_at: string | null }, now = Date.now()): OfferStatus {
  if (!o.is_active) return "off";
  if (Date.parse(o.start_at) > now) return "scheduled";
  if (o.end_at && Date.parse(o.end_at) <= now) return "ended";
  return "live";
}
