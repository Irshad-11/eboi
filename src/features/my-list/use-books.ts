"use client";

import { useEffect, useState } from "react";
import type { BookLite } from "@/features/books/types";

/**
 * Fetches public book data (with live prices) for IDs kept in the browser.
 * Order follows the IDs; unpublished or deleted books simply drop out.
 */
export function useBooksByIds(ids: string[]): { books: BookLite[]; loading: boolean } {
  const key = ids.join(",");
  const [state, setState] = useState<{ key: string; books: BookLite[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    fetch(`/api/books/lookup?ids=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ books: BookLite[] }>) : { books: [] }))
      .then((d) => setState({ key, books: d.books }))
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ key, books: [] });
      });
    return () => ctrl.abort();
  }, [key]);

  if (!key) return { books: [], loading: false };
  if (state?.key !== key) return { books: state?.books ?? [], loading: true };
  return { books: state.books, loading: false };
}
