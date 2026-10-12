"use client";

import { useState, type ReactNode } from "react";
import { Sheet } from "@/components/ui/sheet";
import { IconFilter } from "@/components/icons";

/** Phone filters live in a bottom sheet; the form inside is server-rendered. */
export function MobileFilters({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-outline btn-sm lg:hidden" onClick={() => setOpen(true)}>
        <IconFilter size={18} />
        Filter and sort{activeCount ? ` (${activeCount})` : ""}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Filter and sort" kicker="Shop">
        {children}
      </Sheet>
    </>
  );
}
