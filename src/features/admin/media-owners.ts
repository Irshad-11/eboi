import type { PageKey } from "@/lib/supabase/database.types";

/** Fixed owner folder ids for site-wide media (no database row owns them). */
export const SITE_MEDIA_OWNER = "00000000-0000-4000-8000-000000000001";

export const PAGE_MEDIA_OWNER: Record<PageKey, string> = {
  home: "00000000-0000-4000-8000-000000000010",
  shop: "00000000-0000-4000-8000-000000000011",
  about: "00000000-0000-4000-8000-000000000012",
  "how-to-order": "00000000-0000-4000-8000-000000000013",
  faq: "00000000-0000-4000-8000-000000000014",
  terms: "00000000-0000-4000-8000-000000000015",
};
