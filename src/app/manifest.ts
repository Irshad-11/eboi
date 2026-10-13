import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} PDF books`,
    short_name: SITE.name,
    description: "PDF books. Free preview, order on WhatsApp.",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#0f2a1f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
