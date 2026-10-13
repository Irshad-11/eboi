"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { toQuery, type Facet, type ShopParams } from "@/features/books/catalog";

export type FacetData = {
  categories: Facet[];
  languages: Facet[];
  formats: Facet[];
  deals: number;
  minPrice: number;
  maxPrice: number;
};

type Props = {
  params: ShopParams;
  facets: FacetData;
  basePath: string;
  symbol: string;
  /** Hidden on category pages, where the category is fixed. */
  hideCategory?: boolean;
  /** Keeps field ids unique when the panel renders twice (sidebar and drawer). */
  idPrefix: string;
};

/**
 * Filter list. Every change updates the URL right away (shareable, works
 * with the back button). Multi-select within a group, AND across groups.
 */
export function FilterPanel({ params, facets, basePath, symbol, hideCategory, idPrefix }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [min, setMin] = useState(params.min?.toString() ?? "");
  const [max, setMax] = useState(params.max?.toString() ?? "");

  const push = (next: Partial<ShopParams>) =>
    start(() => router.push(`${basePath}${toQuery({ ...params, ...next, page: undefined })}`, { scroll: false }));

  const toggle = (key: "category" | "language" | "format", value: string) => {
    const cur = params[key];
    push({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
  };

  return (
    <div className={cn("space-y-5 transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      {facets.deals > 0 && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-line bg-white px-3 hover:border-brand">
          <input type="checkbox" className="check" checked={Boolean(params.deals)} onChange={() => push({ deals: params.deals ? undefined : "1" })} />
          <span className="flex-1 text-base font-medium">On offer</span>
          <span className="badge badge-sale">{facets.deals}</span>
        </label>
      )}

      {!hideCategory && <Group title="Category" items={facets.categories} selected={params.category} onToggle={(v) => toggle("category", v)} />}
      <Group title="Language" items={facets.languages} selected={params.language} onToggle={(v) => toggle("language", v)} />

      <fieldset>
        <legend className="text-base font-semibold">Price ({symbol})</legend>
        <p className="mb-2 text-sm text-text-3">
          {symbol}
          {facets.minPrice} – {symbol}
          {facets.maxPrice}
        </p>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const lo = min === "" ? undefined : Math.max(0, Math.round(Number(min)));
            const hi = max === "" ? undefined : Math.max(0, Math.round(Number(max)));
            push({ min: lo, max: hi });
          }}
        >
          <label className="sr-only" htmlFor={`${idPrefix}-min`}>
            Minimum price
          </label>
          <input
            id={`${idPrefix}-min`}
            inputMode="numeric"
            type="number"
            min={0}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="Min"
            className="input h-10 min-h-10 px-2.5"
          />
          <span className="text-text-3">–</span>
          <label className="sr-only" htmlFor={`${idPrefix}-max`}>
            Maximum price
          </label>
          <input
            id={`${idPrefix}-max`}
            inputMode="numeric"
            type="number"
            min={0}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Max"
            className="input h-10 min-h-10 px-2.5"
          />
          <button type="submit" className="btn btn-secondary btn-sm h-10 shrink-0">
            Go
          </button>
        </form>
      </fieldset>

      {facets.formats.length > 1 && <Group title="Format" items={facets.formats} selected={params.format} onToggle={(v) => toggle("format", v)} />}
    </div>
  );
}

function Group({ title, items, selected, onToggle }: { title: string; items: Facet[]; selected: string[]; onToggle: (v: string) => void }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const shown = all ? items : items.slice(0, 6);
  return (
    <fieldset>
      <legend className="mb-1 text-base font-semibold">{title}</legend>
      <ul>
        {shown.map((f) => (
          <li key={f.value}>
            <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-1 hover:bg-muted">
              <input type="checkbox" className="check" checked={selected.includes(f.value)} onChange={() => onToggle(f.value)} />
              <span className="flex-1 text-base">{f.label}</span>
              <span className="text-sm text-text-3 tnum">{f.count}</span>
            </label>
          </li>
        ))}
      </ul>
      {items.length > 6 && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-1 text-sm font-semibold text-brand hover:underline">
          {all ? "Show less" : `Show all ${items.length}`}
        </button>
      )}
    </fieldset>
  );
}
