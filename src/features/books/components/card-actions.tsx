"use client";

import { cn } from "@/lib/cn";
import { IconEye, IconHeart } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { addToList, removeFromList, useMyList } from "@/features/my-list/store";
import { useReader, type ReaderBook } from "@/features/preview/reader-context";
import { useShop } from "@/features/layout/shop-context";
import { formatCompact } from "@/lib/format";

/** "418 sold": real copies sold, shown when the feature is on (Admin > Notices and features). */
export function SoldCount({ sold, className }: { sold: number; className?: string }) {
  const { features } = useShop();
  if (!features.sold_count || sold <= 0) return null;
  return <span className={cn("text-text-3 tnum", className)}>{formatCompact(sold)} sold</span>;
}

/**
 * Heart and quick-preview buttons over a product card's cover. They fade in
 * on desktop hover and are always visible on touch screens (see .quick-actions).
 */
export function CardActions({ book, section, hasPreview }: { book: ReaderBook; section: string; hasPreview: boolean }) {
  const list = useMyList();
  const saved = list.includes(book.id);
  const reader = useReader();
  const { features } = useShop();
  if (!features.card_quick_actions) return null;
  return (
    <div className="quick-actions absolute inset-x-2 bottom-2 flex items-center justify-end gap-1.5">
      {hasPreview && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            reader.open(book);
          }}
          className="mr-auto inline-flex h-8 items-center gap-1 rounded-full bg-white/95 px-3 text-xs font-semibold text-text shadow-sm hover:bg-white hover:text-brand"
        >
          <IconEye size={14} />
          Preview
        </button>
      )}
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? `Remove ${book.title} from My List` : `Add ${book.title} to My List`}
        onClick={(e) => {
          e.preventDefault();
          if (saved) return removeFromList(book.id);
          addToList(book.id);
          track("list_add", { bookId: book.id, section });
        }}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm hover:bg-white",
          saved ? "text-sale" : "text-text-2 hover:text-sale",
        )}
      >
        <IconHeart size={16} filled={saved} />
      </button>
    </div>
  );
}
