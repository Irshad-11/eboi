import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import { SITE } from "@/config/site";
import { publicEnv } from "@/lib/env";
import { getSettings } from "@/features/settings/queries";
import { verificationCode } from "@/features/seo/metadata";
import { SplashScreen, SplashScript } from "@/features/layout/splash";

/** Site-wide defaults, all from Admin > SEO and Settings. */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const google = verificationCode(s.google_verification) ?? verificationCode(publicEnv.gscVerification);
  const bing = verificationCode(s.bing_verification);
  const name = s.site_name || SITE.name;
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: {
      default: `${name}${s.tagline ? ` | ${s.tagline}` : ""}`,
      template: s.title_template.includes("%s") ? s.title_template : `%s | ${name}`,
    },
    description: s.default_meta_description,
    keywords: s.default_keywords,
    applicationName: name,
    alternates: { canonical: "/" },
    robots: s.site_noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { siteName: name, locale: SITE.locale, type: "website", url: "/" },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false, email: false, address: false },
    verification: {
      ...(google ? { google } : {}),
      ...(bing ? { other: { "msvalidate.01": bing } } : {}),
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The splash script sets data-splash on <html> before React loads.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        <SplashScript />
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
