/**
 * Visitor country, for dollar prices and the abroad WhatsApp message.
 * proxy.ts copies Vercel's IP country header into this cookie, so cached
 * (ISR) pages stay the same for everyone and the browser picks the currency.
 */
export const REGION_COOKIE = "eboi_cc";
export const HOME_COUNTRY = "BD";

/** "US" -> "United States". Falls back to the code. */
export function countryName(code: string | null): string {
  if (!code) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** $4.99, $5 */
export function formatUsd(amount: number): string {
  const whole = Math.round(amount * 100) % 100 === 0;
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** Two-letter code or null. */
export function cleanCountry(v: string | null | undefined): string | null {
  const c = (v ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) && c !== "XX" ? c : null;
}

type PricingLike = { final: number; was: number | null; usd: { final: number; was: number | null } | null };
export type LocalPrice = { final: number; was: number | null; usd: boolean };

/**
 * The price in the visitor's currency: the book's own dollar price abroad,
 * else the taka price converted at the admin's rate (if one is set), else taka.
 */
export function localPrice(p: PricingLike, abroad: boolean, rate: number): LocalPrice {
  if (abroad && p.usd) return { final: p.usd.final, was: p.usd.was, usd: true };
  if (abroad && rate > 0) {
    const c = (n: number) => Math.round((n / rate) * 100) / 100;
    return { final: c(p.final), was: p.was != null ? c(p.was) : null, usd: true };
  }
  return { final: p.final, was: p.was, usd: false };
}

/** Sums several books in one currency: dollars only when every book has a dollar price. */
export function localTotal(list: PricingLike[], abroad: boolean, rate: number): { final: number; was: number; usd: boolean } {
  const local = list.map((p) => localPrice(p, abroad, rate));
  const usd = local.length > 0 && local.every((l) => l.usd);
  const src = usd ? local : list.map((p) => localPrice(p, false, 0));
  return {
    final: src.reduce((n, l) => n + l.final, 0),
    was: src.reduce((n, l) => n + (l.was ?? l.final), 0),
    usd,
  };
}
