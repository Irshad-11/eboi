"use client";

import Link from "next/link";
import { IconHeart } from "@/components/icons";
import { useMyList } from "./store";

/** Header heart with a live count badge. */
export function ListCountLink() {
  const n = useMyList().length;
  return (
    <Link
      href="/my-list"
      className="inline-flex h-11 items-center gap-2 rounded-md px-2.5 hover:bg-muted hover:text-sale"
      aria-label={n ? `My List, ${n} ${n === 1 ? "book" : "books"}` : "My List"}
    >
      <span className="relative inline-flex">
        <IconHeart size={22} />
        {n > 0 && (
          <span className="absolute -top-1.5 -right-2 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-sale px-1 text-[0.6875rem] leading-none font-bold text-white ring-2 ring-white tnum">
            {n}
          </span>
        )}
      </span>
      <span className={n > 0 ? "ml-1 hidden text-sm font-semibold xl:inline" : "hidden text-sm font-semibold xl:inline"}>My List</span>
    </Link>
  );
}
