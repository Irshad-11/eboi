import { cn } from "@/lib/cn";
import type { BookBadge } from "@/lib/supabase/database.types";
import { discountLabel, type Pricing } from "@/features/offers/pricing";

/** Red discount badge, computed from the real offer or old price. */
export function DiscountBadge({ pricing, symbol, className }: { pricing: Pricing; symbol: string; className?: string }) {
  const label = discountLabel(pricing, symbol);
  if (!label) return null;
  return <span className={cn("badge badge-sale", className)}>{label}</span>;
}

/** Status badge set by the admin ("New", "Bestseller"). */
export function StatusBadge({ badge, className }: { badge: BookBadge; className?: string }) {
  if (badge === "new") return <span className={cn("badge badge-new", className)}>New</span>;
  if (badge === "bestseller") return <span className={cn("badge badge-best", className)}>Bestseller</span>;
  return null;
}
