import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import { SITE } from "@/config/site";
import { publicEnv } from "@/lib/env";
import { SplashScreen, SplashScript } from "@/features/layout/splash";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${SITE.name} · PDF books, bought on WhatsApp`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["eBoi", "eboi", "PDF books", "PDF book Bangladesh", "buy PDF on WhatsApp", "ebook Bangladesh"],
  alternates: { canonical: "/" },
  openGraph: {
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, email: false, address: false },
  verification: publicEnv.gscVerification ? { google: publicEnv.gscVerification } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#f4f0e6",
  width: "device-width",
  initialScale: 1,
  // Pinch zoom stays allowed: never block zoom for accessibility.
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the splash script sets data-splash on <html> before React hydrates.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <SplashScript />
      </head>
      <body>
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
