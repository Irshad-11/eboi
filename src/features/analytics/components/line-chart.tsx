"use client";

import { useId, useMemo, useState } from "react";
import { formatNumber, formatPrice } from "@/lib/format";

type Point = { label: string; value: number };

/**
 * One series per chart (small multiples instead of a multi-colour legend):
 * the brand greens are deliberately low-chroma, so identity is carried by
 * each chart's title, not by hue. 2px line, recessive grid, crosshair and
 * tooltip on hover/touch, and a visually-hidden table for screen readers.
 */
export function LineChart({
  title,
  points,
  kind = "count",
  summary = "total",
}: {
  title: string;
  points: Point[];
  kind?: "count" | "money";
  /** "average" for per-day uniques, which do not add up across days. */
  summary?: "total" | "average";
}) {
  // A kind flag, not a formatter function: server components cannot pass functions to client ones.
  const format = (n: number) => (kind === "money" ? formatPrice(n) : formatNumber(n));
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = 180;
  const pad = { t: 12, r: 8, b: 22, l: 36 };
  const max = Math.max(1, ...points.map((p) => p.value));
  const niceMax = useMemo(() => {
    const pow = 10 ** Math.floor(Math.log10(max));
    return Math.ceil(max / pow) * pow;
  }, [max]);
  const x = (i: number) => pad.l + (points.length <= 1 ? 0 : (i / (points.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / niceMax) * (H - pad.t - pad.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const total = points.reduce((s, p) => s + p.value, 0);
  const ticks = [0, niceMax / 2, niceMax];
  const labelEvery = Math.ceil(points.length / 6);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  }

  const h = hover != null ? points[hover] : null;

  return (
    <figure className="min-w-0 rounded-lg border border-line bg-white p-4">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-text-2">{title}</span>
        <span className="text-sm font-semibold tnum">{h ? `${h.label}: ${format(h.value)}` : summary === "average" ? `${format(Math.round(total / Math.max(1, points.length)))} a day` : `${format(total)} total`}</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 block h-auto w-full touch-none"
        role="img"
        aria-labelledby={`${id}-t`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <title id={`${id}-t`}>{`${title}, ${format(total)} over ${points.length} days`}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-text-3 text-[10px]">
              {t >= 1000 ? `${Math.round(t / 100) / 10}k` : Math.round(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={p.label} x={x(i)} y={H - 6} textAnchor="middle" className="fill-text-3 text-[10px]">
              {p.label}
            </text>
          ) : null,
        )}
        <path d={path} fill="none" stroke="var(--color-brand)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hover != null && h && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--color-text-3)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(h.value)} r={5} fill="var(--color-brand)" stroke="var(--color-white)" strokeWidth={2} />
          </g>
        )}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.label}>
              <th scope="row">{p.label}</th>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
