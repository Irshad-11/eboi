import type { BookRow } from "@/lib/supabase/database.types";

export const BOOK_JSON_SCHEMA_URL = "/book-import.schema.json";

/**
 * Book row -> import/export JSON (format_version 1). Export, edit, re-import
 * gives back the same book: the round trip is lossless for every field the
 * admin can edit. Files are referenced by name only; they travel separately.
 */
export function toBookJson(book: BookRow, collectionSlugs: string[], siteUrl: string) {
  return {
    $schema: `${siteUrl}${BOOK_JSON_SCHEMA_URL}`,
    format_version: 1 as const,
    book_code: book.book_code,
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle,
    author: book.author,
    category: book.category,
    tags: book.tags,
    language: book.language,
    page_count: book.page_count,
    format: book.format,
    file_size: book.file_size,
    description: book.description,
    highlights: book.highlights,
    table_of_contents: book.table_of_contents,
    price: Number(book.price),
    old_price: book.old_price == null ? null : Number(book.old_price),
    offer_id: book.offer_id,
    rating: Number(book.rating),
    rating_count: book.rating_count,
    total_sells: book.total_sells,
    views: book.views,
    release_date: book.release_date,
    is_featured: book.is_featured,
    status: book.status,
    badge: book.badge,
    seo_title: book.seo_title,
    seo_description: book.seo_description,
    internal_file_note: book.internal_file_note,
    collections: collectionSlugs,
    files: {
      cover: book.cover_path ? `${book.slug}-cover.${book.cover_path.split(".").pop()}` : undefined,
      preview: book.preview_path ? `${book.slug}-preview.pdf` : undefined,
    },
  };
}
