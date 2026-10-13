"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { IconEye } from "@/components/icons";
import { BookCover } from "@/features/books/components/book-cover";
import { useReader, type ReaderBook } from "@/features/preview/reader-context";

type Props = {
  book: ReaderBook;
  cover: string | null;
  coverAlt: string | null;
  author: string;
  /** Preview page images made when the preview was uploaded. */
  thumbs: string[];
  hasPreview: boolean;
  badges: React.ReactNode;
};

/**
 * Product gallery: the cover large, thumbnails below (cover plus preview
 * pages). Picking a preview page shows it; tapping it opens the reader there.
 */
export function Gallery({ book, cover, coverAlt, author, thumbs, hasPreview, badges }: Props) {
  const reader = useReader();
  const [active, setActive] = useState(0);
  const pages = thumbs.length;

  return (
    <div>
      <div className="relative mx-auto max-w-[15rem] sm:max-w-[22rem] lg:max-w-none">
        {active === 0 ? (
          <BookCover src={cover} alt={coverAlt} title={book.title} author={author} sizes="(min-width: 1024px) 400px, 80vw" priority />
        ) : (
          <button
            type="button"
            onClick={() => reader.open(book, active)}
            className="group relative block aspect-[2/3] w-full overflow-hidden rounded-sm bg-white shadow-[var(--shadow-cover)]"
            aria-label={`Open preview page ${active}`}
          >
            <Image src={thumbs[active - 1]!} alt={`Preview page ${active}`} fill sizes="(min-width: 1024px) 400px, 80vw" className="no-copy object-contain" />
            <span className="absolute inset-x-0 bottom-3 mx-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-sm font-medium text-white opacity-90 group-hover:opacity-100">
              <IconEye size={16} />
              Read preview
            </span>
          </button>
        )}
        <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">{badges}</div>
      </div>

      {(pages > 0 || hasPreview) && (
        <ul className="scrollbar-none relative mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Images">
          <li className="shrink-0">
            <Thumb selected={active === 0} onClick={() => setActive(0)} label="Cover">
              <BookCover src={cover} title={book.title} sizes="64px" className="rounded-none shadow-none" />
            </Thumb>
          </li>
          {thumbs.map((t, i) => (
            <li key={t} className="shrink-0">
              <Thumb selected={active === i + 1} onClick={() => setActive(i + 1)} label={`Preview page ${i + 1}`}>
                <span className="relative block aspect-[2/3] w-full bg-white">
                  <Image src={t} alt="" fill sizes="64px" className="object-contain" />
                </span>
              </Thumb>
            </li>
          ))}
          {hasPreview && (
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => reader.open(book, pages ? Math.min(pages + 1, book.preview_page_count ?? pages + 1) : 1)}
                className="flex aspect-[2/3] w-16 flex-col items-center justify-center gap-1 rounded-md border border-line bg-white text-xs font-semibold text-brand hover:border-brand"
              >
                <IconEye size={18} />
                {book.preview_page_count ? `${book.preview_page_count} pages` : "Preview"}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Thumb({ selected, onClick, label, children }: { selected: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "block w-16 overflow-hidden rounded-md border bg-white p-0.5 transition-colors",
        selected ? "border-brand ring-1 ring-brand" : "border-line hover:border-line-2",
      )}
    >
      {children}
    </button>
  );
}
