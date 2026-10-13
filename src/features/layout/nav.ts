import type { NavLink } from "@/features/settings/schema";

/** One item in the navigation row and the mobile drawer. */
export type NavItem = NavLink & { icon?: string; count?: number };

export type HeaderNav = {
  /** Every category with books, for the Categories menu. */
  categories: NavItem[];
  /** Every collection with books, for the Collections menu. */
  collections: NavItem[];
  /** Admin-picked categories and collections shown directly in the row. */
  pinned: NavItem[];
  /** Extra links from Admin > Menus. */
  links: NavItem[];
  /** True when at least one offer is running. */
  hasOffers: boolean;
};

/** Fixed shop shortcuts, shown first in the row and the drawer. */
export const QUICK_LINKS = [
  { label: "All books", url: "/shop", key: "all" },
  { label: "Offers", url: "/shop?deals=1", key: "offers" },
  { label: "New arrivals", url: "/collections/latest", key: "new" },
  { label: "Best sellers", url: "/collections/best-selling", key: "best" },
] as const;
