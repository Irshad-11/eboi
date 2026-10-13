import { formatNumber, formatPercent } from "@/lib/format";

/** View → preview → WhatsApp → sale, each step with its conversion from the one before. */
const SHADES = ["#94b8a3", "#3e7a5e", "#1d5c42", "#0f2a1f"];

export function Funnel({ steps, note }: { steps: { label: string; value: number }[]; note?: string }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <figure className="min-w-0 rounded-lg border border-line bg-white p-4">
      <figcaption className="text-sm font-semibold text-text-2">Funnel</figcaption>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={s.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <div>
              <p className="text-sm font-semibold">{s.label}</p>
              <p className="text-xs text-text-3">{i === 0 ? "Start" : `${formatPercent(s.value, steps[i - 1]!.value)} of previous`}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 rounded-sm" style={{ width: `${Math.max(1.5, (s.value / top) * 100)}%`, background: SHADES[i] ?? SHADES[3] }} />
              <span className="text-sm font-semibold tnum">{formatNumber(s.value)}</span>
            </div>
          </li>
        ))}
      </ol>
      {note && <p className="mt-4 text-xs text-text-3">{note}</p>}
    </figure>
  );
}
