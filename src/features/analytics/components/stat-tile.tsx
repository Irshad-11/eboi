import { cn } from "@/lib/cn";
import { formatDelta } from "@/lib/format";

/** A number with its change vs the previous period (arrow + text, never colour alone). */
export function StatTile({ label, value, sub, current, previous }: { label: string; value: string; sub?: string; current?: number; previous?: number }) {
  const delta = current != null && previous != null ? formatDelta(current, previous) : null;
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm text-text-3">{label}</p>
      <p className="mt-1 text-2xl font-semibold tnum">{value}</p>
      {delta && (
        <p className={cn("mt-1 text-sm", delta.dir === "up" ? "text-brand" : delta.dir === "down" ? "text-sale" : "text-text-3")}>
          <span aria-hidden="true">{delta.dir === "up" ? "▲ " : delta.dir === "down" ? "▼ " : ""}</span>
          {delta.label} <span className="text-text-3">vs previous</span>
        </p>
      )}
      {sub && <p className="mt-1 text-sm text-text-3">{sub}</p>}
    </div>
  );
}
