/**
 * Public URL for a file in the private media bucket. Every upload gets a new
 * random name, so the URL itself is the version and can be cached for a year.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `/api/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

const MEDIA_PATH = /^(banners|categories|collections|thumbs|seo)\/[0-9a-f-]{36}\/[a-z0-9-]+\.(jpg|png|webp)$/;

export function isMediaPath(path: string): boolean {
  return MEDIA_PATH.test(path);
}
