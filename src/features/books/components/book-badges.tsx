"use client";

import { cn } from "@/lib/cn";
import { useRegion } from "@/features/region/use-region";
import type { BookBadge } from "@/lib/supabase/database.types";
import { discountLabel, type Pricing } from "@/features/offers/pricing";

/**
 * Red discount badge, computed from the real offer or old price. Visitors
 * abroad see a percentage instead of a taka amount.
 */
export function DiscountBadge({ pricing, symbol, className }: { pricing: Pricing; symbol: string; className?: string }) {
  const { abroad } = useRegion();
  const local = discountLabel(pricing, symbol);
  const label = abroad && local?.startsWith(symbol) && pricing.was ? `${Math.round(((pricing.was - pricing.final) / pricing.was) * 100)}% off` : local;
  if (!label) return null;
  return <span className={cn("badge", pricing.free ? "badge-free" : "badge-sale", className)}>{label}</span>;
}

/** Status badge set by the admin ("New", "Bestseller"). */
export function StatusBadge({ badge, className }: { badge: BookBadge; className?: string }) {
  if (badge === "new") return <span className={cn("badge badge-new", className)}>New</span>;
  if (badge === "bestseller") return <span className={cn("badge badge-best", className)}>Bestseller</span>;
  return null;
}
