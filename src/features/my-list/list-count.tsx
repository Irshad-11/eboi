"use client";

import Link from "next/link";
import { IconList } from "@/components/icons";
import { useMyList } from "./store";

/** Header link with a live count. */
export function ListCountLink() {
  const n = useMyList().length;
  return (
    <Link
      href="/my-list"
      className="relative inline-flex min-h-11 items-center gap-2 px-2 hover:bg-paper-2"
      aria-label={n ? `My List, ${n} ${n === 1 ? "book" : "books"}` : "My List"}
    >
      <IconList filled={n > 0} />
      <span className="hidden text-small font-semibold sm:inline">My List</span>
      {n > 0 && (
        <span className="absolute top-1 left-5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-pill bg-green-900 px-1 font-mono text-[0.625rem] font-semibold text-paper sm:static sm:h-5 sm:min-w-5 sm:text-[0.6875rem]">
          {n}
        </span>
      )}
    </Link>
  );
}
