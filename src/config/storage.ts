/** Private bucket names. covers/previews come from schema.sql, media from update-01. */
export const BUCKETS = {
  covers: "covers",
  previews: "previews",
  /** Banners, category/collection images, preview thumbnails, share images. */
  media: "media",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Folders inside the media bucket. */
export const MEDIA_FOLDERS = {
  banners: "banners",
  categories: "categories",
  collections: "collections",
  thumbs: "thumbs",
  seo: "seo",
  /** Announcement bar and pop-up images. */
  promo: "promo",
} as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[keyof typeof MEDIA_FOLDERS];
