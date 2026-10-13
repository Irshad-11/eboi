"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronDown } from "@/components/icons";

export type Tab = { id: string; label: string; content: ReactNode };

/** Tabs on desktop; on phones every section starts open (an accordion the reader can fold). */
export function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const [openIds, setOpenIds] = useState<string[]>(tabs.map((t) => t.id));
  if (!tabs.length) return null;

  return (
    <div className="rounded-lg border border-line bg-white">
      <div role="tablist" aria-label="Book information" className="scrollbar-none relative hidden overflow-x-auto border-b border-line px-2 md:flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={cn(
              "relative h-12 px-4 text-base font-semibold whitespace-nowrap transition-colors",
              active === t.id ? "text-brand" : "text-text-3 hover:text-text",
            )}
          >
            {t.label}
            {active === t.id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand" />}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <section key={t.id} id={t.id} className="border-b border-line last:border-b-0 md:border-0">
          <button
            type="button"
            className="flex min-h-13 w-full items-center justify-between gap-3 px-4 text-left text-base font-semibold md:hidden"
            aria-expanded={openIds.includes(t.id)}
            aria-controls={`panel-${t.id}`}
            onClick={() => setOpenIds((ids) => (ids.includes(t.id) ? ids.filter((x) => x !== t.id) : [...ids, t.id]))}
          >
            {t.label}
            <IconChevronDown size={18} className={cn("text-text-3 transition-transform", openIds.includes(t.id) && "rotate-180")} />
          </button>
          <div
            id={`panel-${t.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${t.id}`}
            className={cn(
              "px-4 pb-5 md:p-6",
              !openIds.includes(t.id) && "max-md:hidden",
              active !== t.id && "md:hidden",
            )}
          >
            {t.content}
          </div>
        </section>
      ))}
    </div>
  );
}
