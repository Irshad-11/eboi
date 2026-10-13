import { formatNumber, formatPercent } from "@/lib/format";

/** Ranked horizontal bars, one hue, with the value printed beside each bar. */
export function BarList({ title, items, empty = "No data in this period yet." }: { title: string; items: { label: string; value: number }[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <figure className="min-w-0 rounded-lg border border-line bg-white p-4">
      <figcaption className="text-sm font-semibold text-text-2">{title}</figcaption>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-text-3">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.map((it) => (
            <li key={it.label} title={`${it.label}: ${formatNumber(it.value)} (${formatPercent(it.value, total)})`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{it.label}</span>
                <span className="shrink-0 font-semibold tnum">
                  {formatNumber(it.value)} <span className="font-normal text-text-3">{formatPercent(it.value, total)}</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(it.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
