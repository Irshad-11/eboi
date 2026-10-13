/**
 * Upload limits. The same numbers are enforced in three places: the admin UI
 * (fast feedback), the server action (trust nothing from the browser) and the
 * storage bucket itself (supabase/schema.sql). Change them together.
 */
export const COVER = {
  maxBytes: 2 * 1024 * 1024,
  mimeTypes: ["image/jpeg", "image/png"] as const,
  extensions: { "image/jpeg": "jpg", "image/png": "png" } as const,
  minWidth: 600,
  /** Every cover is shown at 2:3. Other ratios are cropped, so warn early. */
  aspect: 2 / 3,
} as const;

export const PREVIEW = {
  maxBytes: 6 * 1024 * 1024,
  mimeType: "application/pdf",
  /** The brief says "first 5 to 10 pages". 12 leaves room for a title page. */
  maxPages: 12,
  minPages: 1,
  recommended: "5 to 10 pages",
} as const;

export const IMPORT = {
  maxJsonBytes: 256 * 1024,
} as const;

/** Signed URL lifetime for previews. Long enough to load, short enough to be useless when shared. */
export const SIGNED_URL_TTL_SECONDS = 90;

export const TEXT = {
  titleMax: 160,
  subtitleMax: 200,
  descriptionMax: 40000,
  tocMax: 8000,
  highlightMax: 200,
  highlightsMax: 12,
  tagsMax: 12,
} as const;

export const MEDIA = {
  maxBytes: 3 * 1024 * 1024,
  mimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  extensions: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const,
} as const;

/** Banner frames. Images are cropped to these ratios, so the slider never jumps. */
export const BANNER = {
  desktop: { width: 1600, height: 500, label: "1600 × 500 (16:5)" },
  mobile: { width: 900, height: 600, label: "900 × 600 (3:2)" },
} as const;

/** Preview page thumbnails made in the admin's browser when a preview is uploaded. */
export const THUMBS = { count: 4, width: 360 } as const;
