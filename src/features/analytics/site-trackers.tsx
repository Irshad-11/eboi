"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "./client";

/**
 * Page views on every route change, plus one delegated click listener that
 * turns any `a[data-book-id]` click into a `book_click` attributed to the
 * nearest `[data-section]`. One listener instead of hundreds of handlers.
 */
export function SiteTrackers() {
  const pathname = usePathname();

  useEffect(() => {
    track("page_view", { dedupe: `page_view|${pathname}` });
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const link = target?.closest?.("a[data-book-id]") as HTMLAnchorElement | null;
      if (!link) return;
      const section = (link.closest("[data-section]") as HTMLElement | null)?.dataset.section ?? null;
      track("book_click", { bookId: link.dataset.bookId, section });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}

/** Fires once when mounted. Handy for server pages that need a client event. */
export function TrackOnMount(props: Parameters<typeof track>[1] & { type: Parameters<typeof track>[0] }) {
  const { type, ...data } = props;
  const key = JSON.stringify(props);
  // `key` captures every prop, so the effect re-runs only when they change.
  useEffect(() => {
    track(type, data);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
