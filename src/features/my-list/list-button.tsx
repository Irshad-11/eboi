"use client";

import { cn } from "@/lib/cn";
import { IconList } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { addToList, removeFromList, useMyList } from "./store";

/** Toggle a book on My List. Wording says what happens, not "Wishlist". */
export function ListButton({ bookId, section, className }: { bookId: string; section: string; className?: string }) {
  const list = useMyList();
  const saved = list.includes(bookId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => {
        if (saved) return removeFromList(bookId);
        addToList(bookId);
        track("list_add", { bookId, section });
      }}
      className={cn("btn btn-outline", className)}
    >
      <IconList filled={saved} />
      {saved ? "On your list" : "Add to My List"}
    </button>
  );
}
