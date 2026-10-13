"use client";

import { useSyncExternalStore } from "react";
import { formatDate } from "@/lib/format";

function remaining(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const min = m % 60;
  return d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${min}m left` : `${min}m left`;
}

const TICK = 30_000;
function subscribeClock(cb: () => void) {
  const t = setInterval(cb, TICK);
  return () => clearInterval(t);
}
/** Rounded to the tick so the snapshot stays stable between ticks. */
const clockSnapshot = () => Math.floor(Date.now() / TICK) * TICK;

/** Minute-level countdown. The server renders the end date; the timer takes over on mount. */
export function Countdown({ endAt, className }: { endAt: string; className?: string }) {
  const end = new Date(endAt).getTime();
  const now = useSyncExternalStore<number | null>(subscribeClock, clockSnapshot, () => null);

  const label = now == null ? `Ends ${formatDate(endAt)}` : end <= now ? "Ended" : remaining(end - now);
  return (
    <span className={className} suppressHydrationWarning>
      <time dateTime={endAt}>{label}</time>
    </span>
  );
}
