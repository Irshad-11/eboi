import type { BookRow } from "@/lib/supabase/database.types";
import type { Pricing } from "@/features/offers/pricing";

/**
 * Column lists are explicit (never "*"): the anon role is only granted these
 * columns, which keeps `internal_file_note` private at the database level.
 */
export const CARD_COLUMNS =
  "id, book_code, title, subtitle, slug, author, category, tags, language, page_count, format, price, old_price, price_usd, is_free, free_until, offer_id, rating, rating_count, total_sells, views, release_date, is_featured, badge, cover_path, cover_alt, preview_path, preview_page_count, is_demo, created_at, updated_at, noindex" as const;

export const DETAIL_COLUMNS =
  `${CARD_COLUMNS}, file_size, description, highlights, table_of_contents, seo_title, seo_description, focus_keyword, seo_keywords, canonical_url, og_image_path, preview_thumbs, status` as const;

type CardKeys =
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
  | "format"
  | "price"
  | "old_price"
  | "price_usd"
  | "is_free"
  | "free_until"
  | "offer_id"
  | "rating"
  | "rating_count"
  | "total_sells"
  | "views"
  | "release_date"
  | "is_featured"
  | "badge"
  | "cover_path"
  | "cover_alt"
  | "preview_path"
  | "preview_page_count"
  | "is_demo"
  | "created_at"
  | "updated_at"
  | "noindex";

export type BookCardRow = Pick<BookRow, CardKeys>;

export type BookDetailRow = BookCardRow &
  Pick<
    BookRow,
    | "file_size"
    | "description"
    | "highlights"
    | "table_of_contents"
    | "seo_title"
    | "seo_description"
    | "focus_keyword"
    | "seo_keywords"
    | "canonical_url"
    | "og_image_path"
    | "preview_thumbs"
    | "status"
  >;

export type BookCard = BookCardRow & { pricing: Pricing };
export type BookDetail = BookDetailRow & { pricing: Pricing };

/** Minimal shape the browser keeps for My List, recently viewed and search suggestions. */
export type BookLite = {
  id: string;
  slug: string;
  title: string;
  author: string;
  book_code: string;
  coverUrl: string | null;
  pricing: Pricing;
  rating: number;
  rating_count: number;
  is_demo: boolean;
};
