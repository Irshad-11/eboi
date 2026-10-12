import { cn } from "@/lib/cn";
import { formatDelta } from "@/lib/format";

/**
 * A number is the chart. Value large, label small, change vs the previous
 * period in words and an arrow, never colour alone.
 */
export function StatTile({
  label,
  value,
  sub,
  current,
  previous,
}: {
  label: string;
  value: string;
  sub?: string;
  current?: number;
  previous?: number;
}) {
  const delta = current != null && previous != null ? formatDelta(current, previous) : null;
  return (
    <div className="bg-paper p-4 md:p-5">
      <p className="label text-ink-3">{label}</p>
      <p className="price mt-2 text-[1.75rem] leading-none md:text-[2.125rem]">{value}</p>
      {delta && (
        <p className={cn("micro mt-2", delta.dir === "up" ? "text-green-700" : delta.dir === "down" ? "text-rust" : "text-ink-3")}>
          <span aria-hidden="true">{delta.dir === "up" ? "▲ " : delta.dir === "down" ? "▼ " : "■ "}</span>
          {delta.label} <span className="text-ink-3">vs previous period</span>
        </p>
      )}
      {sub && <p className="micro mt-2 text-ink-3">{sub}</p>}
    </div>
  );
}
