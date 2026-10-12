import type { BookRow } from "@/lib/supabase/database.types";
import type { Pricing } from "@/features/offers/pricing";

/**
 * Column lists are explicit (never "*"): the anon role is only granted these
 * columns, which keeps `internal_file_note` private at the database level.
 */
export const CARD_COLUMNS =
  "id, book_code, title, subtitle, slug, author, category, tags, language, page_count, price, old_price, offer_id, rating, rating_count, total_sells, views, release_date, is_featured, badge, cover_path, preview_path, preview_page_count, is_demo, created_at, updated_at" as const;

export const DETAIL_COLUMNS =
  `${CARD_COLUMNS}, format, file_size, description, highlights, table_of_contents, seo_title, seo_description, status` as const;

export type BookCardRow = Pick<
  BookRow,
  | "id"
  | "book_code"
  | "title"
  | "subtitle"
  | "slug"
  | "author"
  | "category"
  | "tags"
  | "language"
  | "page_count"
  | "price"
  | "old_price"
  | "offer_id"
  | "rating"
  | "rating_count"
  | "total_sells"
  | "views"
  | "release_date"
  | "is_featured"
  | "badge"
  | "cover_path"
  | "preview_path"
  | "preview_page_count"
  | "is_demo"
  | "created_at"
  | "updated_at"
>;

export type BookDetailRow = BookCardRow &
  Pick<
    BookRow,
    | "format"
    | "file_size"
    | "description"
    | "highlights"
    | "table_of_contents"
    | "seo_title"
    | "seo_description"
    | "status"
  >;

export type BookCard = BookCardRow & { pricing: Pricing };
export type BookDetail = BookDetailRow & { pricing: Pricing };

/** Minimal shape the browser keeps for My List / recently viewed lookups. */
export type BookLite = {
  id: string;
  slug: string;
  title: string;
  author: string;
  book_code: string;
  coverUrl: string | null;
  pricing: Pricing;
  is_demo: boolean;
};
