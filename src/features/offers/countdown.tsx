"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";

function remaining(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const min = m % 60;
  return d > 0 ? `${d}d ${String(h).padStart(2, "0")}h ${String(min).padStart(2, "0")}m` : `${h}h ${String(min).padStart(2, "0")}m`;
}

/**
 * Minute-level countdown. No ticking seconds: urgency without a flashing
 * number. The server renders the end date; the timer takes over on mount.
 */
export function Countdown({ endAt, className }: { endAt: string; className?: string }) {
  const end = new Date(endAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const label = now == null ? `Ends ${formatDate(endAt)}` : end <= now ? "Ended" : `Ends in ${remaining(end - now)}`;
  return (
    <span className={className} suppressHydrationWarning>
      <time dateTime={endAt}>{label}</time>
    </span>
  );
}
