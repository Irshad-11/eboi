"use client";

import { cn } from "@/lib/cn";
import type { Pricing } from "@/features/offers/pricing";
import { useMoney } from "@/features/region/use-region";

type Props = {
  pricing: Pricing;
  /** Kept for callers; the symbol comes from the shop settings. */
  symbol?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: { now: "text-base", was: "text-sm" },
  md: { now: "text-lg", was: "text-sm" },
  lg: { now: "text-2xl", was: "text-md" },
} as const;

/**
 * Sale price in red, old price struck through in grey. Visitors outside
 * Bangladesh see the dollar price when the admin set one.
 */
export function PriceTag({ pricing, size = "md", className }: Props) {
  const money = useMoney();
  const p = money.price(pricing);
  const s = SIZES[size];
  const sale = p.was != null;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      <span className={cn("price-now", s.now)} data-sale={sale}>
        <span className="sr-only">{sale ? "Sale price " : "Price "}</span>
        {money.fmt(p.final, p.usd)}
      </span>
      {sale && (
        <span className={cn("price-was", s.was)}>
          <span className="sr-only">Regular price </span>
          {money.fmt(p.was!, p.usd)}
        </span>
      )}
    </span>
  );
}

/**
 * A money figure in the visitor's currency: the total, the old total or the
 * saving across one or more books ("from" prices pass the cheapest book).
 */
export function PriceText({ pricings, kind = "final", className }: { pricings: Pricing[]; kind?: "final" | "was" | "save"; className?: string }) {
  const money = useMoney();
  const t = money.total(pricings);
  const n = kind === "final" ? t.final : kind === "was" ? t.was : Math.round((t.was - t.final) * 100) / 100;
  return <span className={className}>{money.fmt(n, t.usd)}</span>;
}
