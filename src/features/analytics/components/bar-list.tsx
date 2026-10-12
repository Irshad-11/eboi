import { formatNumber, formatPercent } from "@/lib/format";

/**
 * Ranked horizontal bars, one hue, value printed beside each bar so the
 * reading never depends on bar length alone. Server-rendered, no JS.
 */
export function BarList({ title, items, empty = "No data in this period yet." }: { title: string; items: { label: string; value: number }[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <figure className="min-w-0 bg-paper p-4">
      <figcaption className="label text-ink-2">{title}</figcaption>
      {items.length === 0 ? (
        <p className="mt-3 text-small text-ink-3">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((it) => (
            <li key={it.label} title={`${it.label}: ${formatNumber(it.value)} (${formatPercent(it.value, total)})`}>
              <div className="flex items-baseline justify-between gap-3 text-small">
                <span className="min-w-0 truncate">{it.label}</span>
                <span className="price shrink-0 text-[0.8125rem]">
                  {formatNumber(it.value)} <span className="font-normal text-ink-3">{formatPercent(it.value, total)}</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-paper-2">
                <div className="h-full rounded-r-xs bg-green-700" style={{ width: `${(it.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
