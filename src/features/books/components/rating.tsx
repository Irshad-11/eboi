import { cn } from "@/lib/cn";
import { formatCompact } from "@/lib/format";
import { IconStar } from "@/components/icons";

/** Stars with a partial fill, the average and the count. Hidden when there are no ratings. */
export function Rating({
  value,
  count,
  size = 14,
  showValue = true,
  className,
}: {
  value: number;
  count: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  if (!count || value <= 0) return null;
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-text-3", className)}>
      <span className="relative inline-flex" aria-hidden="true">
        <span className="flex text-line-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <IconStar key={i} size={size} />
          ))}
        </span>
        <span className="absolute inset-y-0 left-0 flex overflow-hidden text-star" style={{ width: `${pct}%` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <IconStar key={i} size={size} className="shrink-0" />
          ))}
        </span>
      </span>
      {showValue && <span className="font-medium text-text-2 tnum">{value.toFixed(1)}</span>}
      <span className="tnum">({formatCompact(count)})</span>
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5 from {count} ratings
      </span>
    </span>
  );
}
