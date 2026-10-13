import { langOf } from "@/lib/bangla";
import { IconChevronDown } from "./icons";
import type { FaqItem } from "@/features/settings/schema";

/** Accordion of questions. Native <details>, so it works without JavaScript. */
export function FaqList({ items, openFirst = false }: { items: FaqItem[]; openFirst?: boolean }) {
  return (
    <div className="divide-y divide-line rounded-lg border border-line bg-white">
      {items.map((f, i) => (
        <details key={i} className="group" open={openFirst && i === 0}>
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
            <span lang={langOf(f.q)} className="text-base font-semibold">
              {f.q}
            </span>
            <IconChevronDown size={18} className="shrink-0 text-text-3 transition-transform group-open:rotate-180" />
          </summary>
          <p lang={langOf(f.a)} className="px-4 pb-4 text-base whitespace-pre-line text-text-2">
            {f.a}
          </p>
        </details>
      ))}
    </div>
  );
}
