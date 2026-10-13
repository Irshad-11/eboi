"use client";

import type { ReactNode } from "react";
import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from "@/components/icons";

/** Repeating rows with add, remove and reorder. */
export function ListEditor<T>({
  items,
  onChange,
  render,
  blank,
  addLabel,
  max = 20,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  blank: () => T;
  addLabel: string;
  max?: number;
}) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 rounded-md border border-line p-2.5">
          <div className="min-w-0 flex-1">{render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}</div>
          <div className="flex shrink-0 flex-col">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn btn-ghost btn-icon btn-sm" aria-label="Move up">
              <IconArrowUp size={16} />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="btn btn-ghost btn-icon btn-sm" aria-label="Move down">
              <IconArrowDown size={16} />
            </button>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="btn btn-ghost btn-icon btn-sm text-sale hover:text-sale" aria-label="Remove">
              <IconTrash size={16} />
            </button>
          </div>
        </div>
      ))}
      {items.length < max && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange([...items, blank()])}>
          <IconPlus size={16} />
          {addLabel}
        </button>
      )}
    </div>
  );
}
