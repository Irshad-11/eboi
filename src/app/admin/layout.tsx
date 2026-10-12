import type { Metadata } from "next";
import type { ReactNode } from "react";

// Admin pages are per-request (session cookies) and must never be prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · eBoi admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
