import { formatCompact } from "@/lib/format";

const STAR = "M12 2.8l2.7 6 6.5.6-4.9 4.4 1.4 6.4L12 16.9l-5.7 3.3 1.4-6.4-4.9-4.4 6.5-.6z";

/** Five stars with a partial fill, plus the count. Hidden when there are no ratings. */
export function Rating({ value, count, compact = false }: { value: number; count: number; compact?: boolean }) {
  if (!count || value <= 0) return null;
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className="inline-flex items-center gap-2 text-ink-2">
      <span className="relative inline-block h-3.5 w-[4.6rem]" aria-hidden="true">
        <Stars className="absolute inset-0 text-paper-3" />
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <Stars className="h-3.5 w-[4.6rem] text-green-700" />
        </span>
      </span>
      <span className="micro tnum">
        {value.toFixed(1)}
        {!compact && <span className="text-ink-3"> ({formatCompact(count)})</span>}
      </span>
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5 by {count} readers
      </span>
    </span>
  );
}

function Stars({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 24" className={className} fill="currentColor">
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={STAR} transform={`translate(${i * 24} 0)`} />
      ))}
    </svg>
  );
}
