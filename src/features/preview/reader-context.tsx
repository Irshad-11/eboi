"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { MessageBook } from "@/features/whatsapp/message";

export type ReaderBook = MessageBook & {
  id: string;
  page_count: number | null;
  preview_page_count: number | null;
};

type Ctx = { open: (book: ReaderBook, page?: number) => void };

const ReaderContext = createContext<Ctx>({ open: () => undefined });

// The reader (and pdf.js) loads only when someone opens a preview.
const PreviewReader = dynamic(() => import("./preview-reader").then((m) => m.PreviewReader), { ssr: false });

/** One reader for the whole site, opened from cards, the gallery and buttons. */
export function ReaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ book: ReaderBook; page: number; key: number } | null>(null);
  const open = useCallback((book: ReaderBook, page = 1) => setState({ book, page, key: Date.now() }), []);
  return (
    <ReaderContext.Provider value={{ open }}>
      {children}
      {state && <PreviewReader key={state.key} book={state.book} startPage={state.page} onClose={() => setState(null)} />}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  return useContext(ReaderContext);
}
