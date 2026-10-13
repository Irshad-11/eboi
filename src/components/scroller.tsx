"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronLeft, IconChevronRight } from "./icons";

/**
 * Horizontal row with swipe on touch and arrow buttons on desktop (shown on
 * hover, hidden at either end). Children are already-rendered items.
 */
export function Scroller({
  children,
  className,
  itemClass,
  label,
  lead,
  leadClass,
}: {
  children: ReactNode[];
  className?: string;
  itemClass?: string;
  label: string;
  /** Optional wider first item (e.g. a collection intro card). */
  lead?: ReactNode;
  leadClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // A short row (few books after the lead card): the lead card widens to fill the line on desktop.
  const growLead = Boolean(lead) && children.length <= 4;
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow = "absolute top-[38%] z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-text shadow-md transition-opacity hover:text-brand md:flex md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100";

  return (
    <div className={cn("group relative", className)}>
      <div
        ref={ref}
        className={cn("scroller -mx-1 scroll-px-1 gap-3 px-1 pb-2 sm:gap-4", growLead && "md:grid-cols-[minmax(20rem,1fr)_repeat(var(--n),max-content)]")}
        style={growLead ? { ["--n" as string]: children.length } : undefined}
        role="list"
        aria-label={label}
      >
        {lead && (
          <div role="listitem" className={cn("w-[80vw] max-w-[22rem] sm:w-[22rem]", growLead && "md:w-auto md:max-w-none", leadClass)}>
            {lead}
          </div>
        )}
        {children.map((child, i) => (
          <div key={i} role="listitem" className={cn("w-[41vw] max-w-[12.5rem] sm:w-[29vw] md:w-[21vw] lg:w-[11.75rem] xl:w-[12.5rem]", itemClass)}>
            {child}
          </div>
        ))}
      </div>
      {!edge.start && (
        <button type="button" aria-label="Scroll left" onClick={() => go(-1)} className={cn(arrow, "-left-3")}>
          <IconChevronLeft size={20} />
        </button>
      )}
      {!edge.end && (
        <button type="button" aria-label="Scroll right" onClick={() => go(1)} className={cn(arrow, "-right-3")}>
          <IconChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
