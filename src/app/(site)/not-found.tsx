import type { Metadata } from "next";
import { NotFoundView } from "@/features/layout/not-found-view";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** A missing book, category or collection. The shop layout already draws the header and footer once. */
export default function NotFound() {
  return <NotFoundView />;
}
