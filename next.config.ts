import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Book URLs are shared on WhatsApp: one form only, no trailing slash.
  trailingSlash: false,
  images: {
    // Covers are versioned with ?v=<hash> so they can be cached for a year.
    // Everything else local must have no query string.
    localPatterns: [{ pathname: "/api/cover/**" }, { pathname: "/**", search: "" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // OG images and demo covers are drawn on the server with these font files.
  outputFileTracingIncludes: {
    "/**": ["./src/assets/fonts/og/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // The admin panel should never be indexed or framed.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
