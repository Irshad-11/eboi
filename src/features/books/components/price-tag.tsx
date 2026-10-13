import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import type { Pricing } from "@/features/offers/pricing";

type Props = {
  pricing: Pricing;
  symbol: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: { now: "text-base", was: "text-sm" },
  md: { now: "text-lg", was: "text-sm" },
  lg: { now: "text-2xl", was: "text-md" },
} as const;

/** Sale price in red, old price struck through in grey. */
export function PriceTag({ pricing, symbol, size = "md", className }: Props) {
  const s = SIZES[size];
  const sale = pricing.was != null;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      <span className={cn("price-now", s.now)} data-sale={sale}>
        <span className="sr-only">{sale ? "Sale price " : "Price "}</span>
        {formatPrice(pricing.final, symbol)}
      </span>
      {sale && (
        <span className={cn("price-was", s.was)}>
          <span className="sr-only">Regular price </span>
          {formatPrice(pricing.was!, symbol)}
        </span>
      )}
    </span>
  );
}
