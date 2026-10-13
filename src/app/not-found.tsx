import type { Metadata } from "next";
import { SiteChrome } from "@/features/layout/site-chrome";
import { NotFoundView } from "@/features/layout/not-found-view";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** 404 for addresses outside the shop pages. Those already have a header and footer, see (site)/not-found. */
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundView />
    </SiteChrome>
  );
}
