import { formatNumber, formatPercent } from "@/lib/format";

/**
 * View -> preview -> WhatsApp -> sale. Ordered steps share one hue that
 * deepens as people get closer to buying; each step states its conversion
 * from the step before, in words.
 */
const SHADES = ["bg-green-300", "bg-green-500", "bg-green-700", "bg-green-900"];

export function Funnel({ steps, note }: { steps: { label: string; value: number }[]; note?: string }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <figure className="min-w-0 bg-paper p-4">
      <figcaption className="label text-ink-2">Funnel</figcaption>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={s.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <div>
              <p className="text-small font-semibold">{s.label}</p>
              <p className="micro text-ink-3">{i === 0 ? "start" : `${formatPercent(s.value, steps[i - 1]!.value)} of previous`}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-7 ${SHADES[i] ?? "bg-green-900"}`} style={{ width: `${Math.max(1.5, (s.value / top) * 100)}%` }} />
              <span className="price text-small">{formatNumber(s.value)}</span>
            </div>
          </li>
        ))}
      </ol>
      {note && <p className="micro mt-4 text-ink-3">{note}</p>}
    </figure>
  );
}
