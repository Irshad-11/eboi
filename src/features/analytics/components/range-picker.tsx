import Link from "next/link";
import { cn } from "@/lib/cn";
import { RANGES, type RangeDays } from "@/config/analytics";

/** 7 / 30 / 90 days as plain links: shareable, no client state. */
export function RangePicker({ value, basePath }: { value: RangeDays; basePath: string }) {
  return (
    <nav aria-label="Date range" className="inline-flex border-2 border-ink">
      {RANGES.map((r) => (
        <Link
          key={r}
          href={`${basePath}?range=${r}`}
          aria-current={r === value ? "true" : undefined}
          className={cn("inline-flex min-h-10 items-center px-3 font-mono text-small", r === value ? "bg-green-900 text-paper" : "hover:bg-paper-2", r !== RANGES[0] && "border-l-2 border-ink")}
        >
          {r} days
        </Link>
      ))}
    </nav>
  );
}
