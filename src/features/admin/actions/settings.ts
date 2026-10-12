"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server";
import { generalSettingsSchema, pagesContentSchema, type GeneralSettingsInput, type PagesContentInput } from "@/features/settings/schema";
import { requireAdmin } from "../auth";
import { dbError, fail, zodFieldErrors, type ActionResult } from "../action-result";

export async function saveGeneralSettings(values: GeneralSettingsInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = generalSettingsSchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  const supabase = await createSessionClient();
  const { error } = await supabase.from("site_settings").update(parsed.data).eq("id", 1);
  if (error) return fail(dbError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved. The site updates right away." };
}

export async function savePagesContent(values: PagesContentInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = pagesContentSchema.safeParse(values);
  if (!parsed.success) return fail("Some fields need fixing.", zodFieldErrors(parsed.error));
  const supabase = await createSessionClient();
  const { error } = await supabase.from("site_settings").update(parsed.data).eq("id", 1);
  if (error) return fail(dbError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: "Pages saved." };
}
