"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/server";
import { requireAdmin } from "../auth";
import { dbError, fail, zodFieldErrors, type ActionResult } from "../action-result";

const saleSchema = z.object({
  bookId: z.uuid({ message: "Pick a book" }),
  price: z.coerce.number().min(0).max(100000),
  soldOn: z.iso.date(),
  note: z.string().trim().max(300).optional(),
  /** Copies sold in one go (each is its own row, so "total sold" goes up by this many). */
  copies: z.coerce.number().int().min(1, "At least 1").max(100, "Up to 100 at once").default(1),
});

/**
 * Logs one sale. Title, code and price are copied into the row so revenue
 * history survives even if the book is edited or deleted later. A database
 * trigger bumps the book's public "total sold" counter.
 */
export async function logSale(input: z.input<typeof saleSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) return fail("Check the sale details.", zodFieldErrors(parsed.error));
  const supabase = await createSessionClient();
  const { data: book } = await supabase.from("books").select("title, book_code").eq("id", parsed.data.bookId).maybeSingle();
  if (!book) return fail("That book no longer exists.");

  // A date alone is stored at midday Dhaka time so it never slips into the next or previous day.
  const soldAt = new Date(`${parsed.data.soldOn}T12:00:00+06:00`).toISOString();
  const row = {
    book_id: parsed.data.bookId,
    book_title_snapshot: book.title,
    book_code_snapshot: book.book_code,
    price_snapshot: parsed.data.price,
    sold_at: soldAt,
    note: parsed.data.note || null,
  };
  const n = parsed.data.copies;
  const { error } = await supabase.from("sales_log").insert(Array.from({ length: n }, () => row));
  if (error) return fail(dbError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: n > 1 ? `Logged ${n} copies of ${book.title}. Sold went up by ${n}.` : `Logged: ${book.title}. Sold went up by 1.` };
}

/** Removes a mistaken entry. The trigger takes the sale back off "total sold". */
export async function deleteSale(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("sales_log").delete().eq("id", id);
  if (error) return fail(dbError(error, "delete"));
  revalidatePath("/", "layout");
  return { ok: true, message: "Sale removed." };
}
