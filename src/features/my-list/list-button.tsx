"use client";

import { cn } from "@/lib/cn";
import { IconHeart } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { addToList, removeFromList, useMyList } from "./store";

/** Heart toggle for My List. Icon-only, or with a label. */
export function ListButton({
  bookId,
  section,
  withLabel = false,
  className,
}: {
  bookId: string;
  section: string;
  withLabel?: boolean;
  className?: string;
}) {
  const saved = useMyList().includes(bookId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={withLabel ? undefined : saved ? "Remove from My List" : "Add to My List"}
      title={saved ? "Remove from My List" : "Add to My List"}
      onClick={() => {
        if (saved) return removeFromList(bookId);
        addToList(bookId);
        track("list_add", { bookId, section });
      }}
      className={cn("btn btn-secondary", !withLabel && "btn-icon", saved && "border-sale text-sale hover:border-sale hover:bg-sale-soft hover:text-sale", className)}
    >
      <IconHeart size={20} filled={saved} />
      {withLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}
