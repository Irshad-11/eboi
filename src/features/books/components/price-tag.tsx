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
  sm: { now: "text-[0.95rem]", was: "text-[0.8rem]" },
  md: { now: "text-[1.125rem]", was: "text-[0.875rem]" },
  lg: { now: "text-price md:text-[2rem]", was: "text-[1rem]" },
} as const;

/** Final price first and loudest; the struck price is context, not decoration. */
export function PriceTag({ pricing, symbol, size = "md", className }: Props) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("price", s.now, pricing.was != null && "text-green-800")}>
        <span className="sr-only">Price </span>
        {formatPrice(pricing.final, symbol)}
      </span>
      {pricing.was != null && (
        <span className={cn("price-was", s.was)}>
          <span className="sr-only">was </span>
          {formatPrice(pricing.was, symbol)}
        </span>
      )}
    </span>
  );
}
