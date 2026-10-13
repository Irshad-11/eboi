import type { MetadataRoute } from "next";
import { absoluteUrl, publicEnv } from "@/lib/env";
import { getSettings } from "@/features/settings/queries";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  if (settings.site_noindex) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/cover/", "/api/media/"],
        // Admin, private APIs and personal pages stay out of search results.
        disallow: ["/admin", "/api/", "/my-list"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: publicEnv.siteUrl,
  };
}
