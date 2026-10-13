import { SiteOgImage } from "@/features/seo/site-og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "eBoi PDF books";
export const revalidate = 3600;

export default function Image() {
  return SiteOgImage();
}
