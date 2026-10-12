import type { MetadataRoute } from "next";
import { absoluteUrl, publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/cover/"],
        // Admin, private APIs and personal pages stay out of search results.
        disallow: ["/admin", "/api/", "/my-list"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: publicEnv.siteUrl,
  };
}
