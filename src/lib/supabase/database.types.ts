/**
 * Database types for supabase-js, written to match supabase/schema.sql.
 *
 * WHY hand-written: the project must compile before you have a Supabase
 * project. The shape is identical to `supabase gen types typescript`, so once
 * your project exists you can regenerate it with:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type BookStatus = "draft" | "published";
export type BookBadge = "none" | "new" | "bestseller";
export type DiscountType = "percent" | "fixed";
export type OfferScope = "all" | "books" | "collections";
export type CollectionMood = "paper" | "forest" | "ink";

export type BookRow = Timestamps & {
  id: string;
  book_code: string;
  title: string;
  subtitle: string | null;
  slug: string;
  author: string;
  category: string;
  tags: string[];
  language: string;
  page_count: number | null;
  format: string;
  file_size: string | null;
  description: string;
  highlights: string[];
  table_of_contents: string;
  price: number;
  old_price: number | null;
  offer_id: string | null;
  rating: number;
  rating_count: number;
  total_sells: number;
  views: number;
  release_date: string | null;
  is_featured: boolean;
  status: BookStatus;
  badge: BookBadge;
  seo_title: string | null;
  seo_description: string | null;
  cover_path: string | null;
  preview_path: string | null;
  preview_page_count: number | null;
  internal_file_note: string | null;
  is_demo: boolean;
};

export type OfferRow = Timestamps & {
  id: string;
  title: string;
  banner_text: string;
  discount_type: DiscountType;
  value: number;
  applies_to: OfferScope;
  start_at: string;
  end_at: string | null;
  show_countdown: boolean;
  is_active: boolean;
  is_demo: boolean;
};

export type CollectionRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  description: string;
  editorial_intro: string;
  mood: CollectionMood;
  sort_order: number;
  show_on_home: boolean;
  is_demo: boolean;
};

export type SalesLogRow = {
  id: string;
  book_id: string | null;
  book_title_snapshot: string;
  book_code_snapshot: string | null;
  price_snapshot: number;
  sold_at: string;
  note: string | null;
  is_demo: boolean;
  created_at: string;
};

export type EventRow = {
  id: number;
  type: string;
  book_id: string | null;
  section: string | null;
  anon_id: string;
  session_id: string;
  path: string | null;
  referrer: string | null;
  device: string | null;
  term: string | null;
  result_count: number | null;
  page: number | null;
  dedupe_key: string;
  is_demo: boolean;
  created_at: string;
};

export type SiteSettingsRow = {
  id: number;
  site_name: string;
  tagline: string;
  whatsapp_number: string;
  whatsapp_template: string;
  whatsapp_list_template: string;
  currency_symbol: string;
  announcement: string;
  announcement_active: boolean;
  delivery_note: string;
  about_content: string;
  faq_items: Json;
  terms_content: string;
  how_to_buy_steps: Json;
  social_links: Json;
  updated_at: string;
};

/** Makes columns with database defaults optional for inserts. */
type InsertOf<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>;

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Insert, R extends Rel[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: R;
};

export type Database = {
  public: {
    Tables: {
      admin_users: Table<{ user_id: string; created_at: string }, { user_id: string; created_at?: string }>;
      books: Table<
        BookRow,
        InsertOf<BookRow, "title" | "slug" | "price">,
        [
          {
            foreignKeyName: "books_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
        ]
      >;
      book_slug_history: Table<
        { old_slug: string; book_id: string; changed_at: string },
        { old_slug: string; book_id: string; changed_at?: string },
        [
          {
            foreignKeyName: "book_slug_history_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ]
      >;
      offers: Table<OfferRow, InsertOf<OfferRow, "title" | "discount_type" | "value">>;
      collections: Table<CollectionRow, InsertOf<CollectionRow, "name" | "slug">>;
      collection_books: Table<
        { collection_id: string; book_id: string; position: number },
        { collection_id: string; book_id: string; position?: number },
        [
          {
            foreignKeyName: "collection_books_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_books_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ]
      >;
      collection_slug_history: Table<
        { old_slug: string; collection_id: string; changed_at: string },
        { old_slug: string; collection_id: string; changed_at?: string },
        [
          {
            foreignKeyName: "collection_slug_history_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ]
      >;
      offer_books: Table<
        { offer_id: string; book_id: string },
        { offer_id: string; book_id: string },
        [
          {
            foreignKeyName: "offer_books_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offer_books_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ]
      >;
      offer_collections: Table<
        { offer_id: string; collection_id: string },
        { offer_id: string; collection_id: string },
        [
          {
            foreignKeyName: "offer_collections_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offer_collections_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ]
      >;
      sales_log: Table<
        SalesLogRow,
        InsertOf<SalesLogRow, "book_title_snapshot" | "price_snapshot">,
        [
          {
            foreignKeyName: "sales_log_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ]
      >;
      events: Table<
        EventRow,
        InsertOf<EventRow, "type" | "anon_id" | "session_id" | "dedupe_key">,
        [
          {
            foreignKeyName: "events_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ]
      >;
      site_settings: Table<SiteSettingsRow, Partial<SiteSettingsRow>>;
    };
    Views: {
      sales_by_month: {
        Row: { month: string; sales: number; revenue: number };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      analytics_summary: {
        Args: { p_from: string; p_to: string; p_book?: string | null };
        Returns: {
          visitors: number;
          page_views: number;
          book_views: number;
          preview_opens: number;
          whatsapp_clicks: number;
          whatsapp_opens: number;
          copy_clicks: number;
          list_adds: number;
          searches: number;
          sales: number;
          revenue: number;
        }[];
      };
      analytics_daily: {
        Args: { p_from: string; p_to: string; p_book?: string | null; p_tz?: string };
        Returns: {
          day: string;
          visitors: number;
          book_views: number;
          preview_opens: number;
          whatsapp_clicks: number;
          sales: number;
          revenue: number;
        }[];
      };
      analytics_funnel: {
        Args: { p_from: string; p_to: string; p_book?: string | null };
        Returns: {
          viewed: number;
          previewed: number;
          clicked: number;
          sold: number;
          avg_preview_page: number | null;
        }[];
      };
      analytics_breakdown: {
        Args: {
          p_from: string;
          p_to: string;
          p_dimension: "referrer" | "device" | "section" | "path";
          p_book?: string | null;
          p_limit?: number;
        };
        Returns: { label: string; value: number }[];
      };
      analytics_top_books: {
        Args: { p_from: string; p_to: string; p_limit?: number };
        Returns: {
          book_id: string;
          title: string;
          book_code: string;
          views: number;
          preview_opens: number;
          whatsapp_clicks: number;
          sales: number;
          revenue: number;
        }[];
      };
      analytics_search_terms: {
        Args: { p_from: string; p_to: string; p_limit?: number };
        Returns: {
          term: string;
          searches: number;
          zero_result_searches: number;
          last_result_count: number | null;
          last_searched_at: string;
        }[];
      };
    };
    Enums: {
      book_status: BookStatus;
      book_badge: BookBadge;
      discount_type: DiscountType;
      offer_scope: OfferScope;
      collection_mood: CollectionMood;
    };
    CompositeTypes: Record<string, never>;
  };
};
