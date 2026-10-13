"use client";

import { cn } from "@/lib/cn";
import { IconEye } from "@/components/icons";
import { useReader, type ReaderBook } from "@/features/preview/reader-context";

/** Opens the preview reader. */
export function PreviewButton({ book, page = 1, className, label = "Read preview" }: { book: ReaderBook; page?: number; className?: string; label?: string }) {
  const reader = useReader();
  return (
    <button type="button" onClick={() => reader.open(book, page)} className={cn("btn btn-secondary", className)}>
      <IconEye size={18} />
      {label}
    </button>
  );
}
