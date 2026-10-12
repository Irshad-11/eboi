import type { BookBadge } from "@/lib/supabase/database.types";
import type { Pricing } from "@/features/offers/pricing";

type Props = {
  badge: BookBadge;
  pricing?: Pricing;
  isDemo?: boolean;
  className?: string;
};

/** Badges are rare on purpose: at most one status badge plus an offer flag. */
export function BookBadges({ badge, pricing, isDemo, className }: Props) {
  const offer = pricing?.offer && pricing.savePercent ? `${pricing.savePercent}% off` : null;
  if (badge === "none" && !offer && !isDemo) return null;
  return (
    <span className={className ?? "flex flex-wrap gap-1.5"}>
      {badge === "new" && <span className="badge badge-new">New</span>}
      {badge === "bestseller" && <span className="badge badge-bestseller">Bestseller</span>}
      {offer && <span className="badge badge-offer">{offer}</span>}
      {isDemo && <span className="badge badge-demo">Demo</span>}
    </span>
  );
}
