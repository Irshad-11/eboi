import Link from "next/link";
import { cn } from "@/lib/cn";
import { RANGES, type RangeDays } from "@/config/analytics";

/** 7 / 30 / 90 days as a segmented control made of links (shareable URLs). */
export function RangePicker({ value, basePath }: { value: RangeDays; basePath: string }) {
  return (
    <nav aria-label="Date range" className="inline-flex rounded-md border border-line-2 bg-white p-0.5">
      {RANGES.map((r) => (
        <Link
          key={r}
          href={`${basePath}?range=${r}`}
          aria-current={r === value ? "true" : undefined}
          className={cn("inline-flex h-8 items-center rounded-sm px-3 text-sm font-medium", r === value ? "bg-brand text-white" : "text-text-2 hover:bg-muted")}
        >
          {r} days
        </Link>
      ))}
    </nav>
  );
}
