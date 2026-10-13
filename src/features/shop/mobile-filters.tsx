"use client";

import { useState, type ReactNode } from "react";
import { Drawer } from "@/components/ui/drawer";
import { IconFilter } from "@/components/icons";

/** Phone filters: a button with the active count that opens a drawer. */
export function MobileFilters({ activeCount, resultCount, chips, children }: { activeCount: number; resultCount: number; chips: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-secondary h-10 min-h-10 lg:hidden" onClick={() => setOpen(true)}>
        <IconFilter size={18} />
        Filters
        {activeCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs text-white">{activeCount}</span>}
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        footer={
          <button type="button" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
            Show {resultCount} {resultCount === 1 ? "book" : "books"}
          </button>
        }
      >
        {activeCount > 0 && <div className="border-b border-line px-4 py-3">{chips}</div>}
        <div className="px-4 py-4">{children}</div>
      </Drawer>
    </>
  );
}
