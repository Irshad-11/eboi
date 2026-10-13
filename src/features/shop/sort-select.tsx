"use client";

import { useRouter } from "next/navigation";
import { SORTS, toQuery, type ShopParams, type SortKey } from "@/features/books/catalog";

/** Sort dropdown; changes the URL immediately. */
export function SortSelect({ params, basePath, id = "sort" }: { params: ShopParams; basePath: string; id?: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="hidden text-sm text-text-3 sm:block">
        Sort by
      </label>
      <select
        id={id}
        value={params.sort ?? "relevance"}
        onChange={(e) => router.push(`${basePath}${toQuery({ ...params, sort: e.target.value as SortKey, page: undefined })}`, { scroll: false })}
        className="select h-10 min-h-10 w-auto py-1.5 text-sm"
      >
        {Object.entries(SORTS).map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
