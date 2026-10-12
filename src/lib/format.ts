import { SITE } from "@/config/site";

/**
 * Formats a Taka amount. Prices are whole numbers in practice, so decimals are
 * shown only when present (৳250, ৳199.50).
 */
export function formatPrice(amount: number, symbol: string = SITE.defaultCurrencySymbol): string {
  const hasDecimals = Math.round(amount * 100) % 100 !== 0;
  const n = amount.toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${symbol}${n}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

/** 1240 -> "1.2k". Used for public display counters. */
export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 100000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 100000).toFixed(1).replace(/\.0$/, "")} lakh`;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: SITE.timezone,
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

const longDateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: SITE.timezone,
});

export function formatLongDate(d: Date): string {
  return longDateFmt.format(d);
}

export function formatPercent(part: number, whole: number): string {
  if (!whole) return "0%";
  const p = (part / whole) * 100;
  return `${p < 10 ? p.toFixed(1) : Math.round(p)}%`;
}

/** Change vs previous period: "+12%", "-3%", "new". */
export function formatDelta(current: number, previous: number): { label: string; dir: "up" | "down" | "flat" } {
  if (previous === 0) return current === 0 ? { label: "0%", dir: "flat" } : { label: "new", dir: "up" };
  const d = ((current - previous) / previous) * 100;
  if (Math.abs(d) < 0.5) return { label: "0%", dir: "flat" };
  return { label: `${d > 0 ? "+" : ""}${Math.round(d)}%`, dir: d > 0 ? "up" : "down" };
}

const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-10-01" -> "October 2026" (month buckets are plain dates, so read them as UTC). */
export function formatMonth(value: string): string {
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? "" : monthFmt.format(d);
}

/** "1 book", "9 books". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}
