"use client";

import { useEffect } from "react";
import { track } from "@/features/analytics/client";
import { pushRecent } from "./store";

/** On a book page: record a real view and remember it for "Continue browsing". */
export function BookViewTracker({ bookId }: { bookId: string }) {
  useEffect(() => {
    pushRecent(bookId);
    track("book_view", { bookId, section: null });
  }, [bookId]);
  return null;
}
