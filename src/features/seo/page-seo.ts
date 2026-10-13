import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { PageKey, PageSeoRow } from "@/lib/supabase/database.types";

export const PAGE_KEYS: Record<PageKey, { label: string; path: string }> = {
  home: { label: "Home", path: "/" },
  shop: { label: "Shop", path: "/shop" },
  about: { label: "About", path: "/about" },
  "how-to-order": { label: "How to order", path: "/how-to-order" },
  faq: { label: "FAQ", path: "/faq" },
  terms: { label: "Refund and terms", path: "/terms" },
};

export const getAllPageSeo = cache(async (): Promise<Partial<Record<PageKey, PageSeoRow>>> => {
  if (!isSupabaseConfigured) return {};
  const { data, error } = await createPublicClient().from("page_seo").select("*");
  if (error) {
    console.error("[page_seo] read failed:", error.message);
    return {};
  }
  return Object.fromEntries((data ?? []).map((r) => [r.page_key, r]));
});

export async function getPageSeo(key: PageKey): Promise<PageSeoRow | null> {
  return (await getAllPageSeo())[key] ?? null;
}
