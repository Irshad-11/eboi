/**
 * Public URL for a file in the private media bucket. Every upload gets a new
 * random name, so the URL itself is the version and can be cached for a year.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (isExternalUrl(path)) return path;
  return `/api/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Every image field takes either an upload (a storage path) or a full
 * https:// image link pasted in the admin.
 */
export function isExternalUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && /^https?:\/\/\S+$/i.test(value);
}

/** A pasted image link the admin may save: https only, sensible length. */
export function isValidImageUrl(value: string): boolean {
  if (!/^https:\/\/[^\s"'<>]+$/i.test(value) || value.length > 1000) return false;
  try {
    return Boolean(new URL(value).hostname.includes("."));
  } catch {
    return false;
  }
}

/** GIFs and outside links skip the image optimizer (animations stay animated). */
export function skipOptimizer(src: string | null | undefined): boolean {
  if (!src) return false;
  return isExternalUrl(src) || /\.gif($|[?#])/i.test(src);
}

/** Absolute URL for meta tags: outside links stay as they are. */
export function absoluteImage(src: string, site: string): string {
  return isExternalUrl(src) ? src : `${site}${src.startsWith("/") ? src : `/${src}`}`;
}

const MEDIA_PATH = /^(banners|categories|collections|thumbs|seo|promo)\/[0-9a-f-]{36}\/[a-z0-9-]+\.(jpg|png|webp|gif)$/;

export function isMediaPath(path: string): boolean {
  return MEDIA_PATH.test(path);
}
