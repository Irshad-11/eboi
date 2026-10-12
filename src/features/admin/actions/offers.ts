"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server";
import { offerInputSchema, type OfferFormValues } from "@/features/offers/schema";
import { requireAdmin } from "../auth";
import { dbError, fail, zodFieldErrors, type ActionResult } from "../action-result";

export async function saveOffer(id: string | null, values: OfferFormValues): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = offerInputSchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  const { bookIds, collectionIds, ...row } = parsed.data;
  const supabase = await createSessionClient();

  const res = id
    ? await supabase.from("offers").update(row).eq("id", id).select("id").single()
    : await supabase.from("offers").insert(row).select("id").single();
  if (res.error || !res.data) return fail(dbError(res.error ?? { message: "unknown" }));
  const offerId = res.data.id;

  // Targets are replaced wholesale; only the list matching applies_to is kept.
  const books = row.applies_to === "books" ? [...new Set(bookIds)] : [];
  const cols = row.applies_to === "collections" ? [...new Set(collectionIds)] : [];
  const steps = [
    await supabase.from("offer_books").delete().eq("offer_id", offerId),
    await supabase.from("offer_collections").delete().eq("offer_id", offerId),
    books.length ? await supabase.from("offer_books").insert(books.map((book_id) => ({ offer_id: offerId, book_id }))) : null,
    cols.length ? await supabase.from("offer_collections").insert(cols.map((collection_id) => ({ offer_id: offerId, collection_id }))) : null,
  ];
  const stepError = steps.find((s) => s?.error)?.error;
  revalidatePath("/", "layout");
  if (stepError) return { ok: true, data: { id: offerId }, message: `Offer saved, but its targets failed: ${stepError.message}` };
  return { ok: true, data: { id: offerId }, message: id ? "Saved." : "Offer created." };
}

export async function deleteOffer(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) return fail(dbError(error, "delete"));
  revalidatePath("/", "layout");
  return { ok: true, message: "Offer deleted. Prices are back to normal." };
}
