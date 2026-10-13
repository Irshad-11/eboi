import type { NavLink } from "@/features/settings/schema";

/** One item in the category navigation row and the mobile drawer. */
export type NavItem = NavLink & { icon?: string };

export type HeaderNav = {
  categories: NavItem[];
  collections: NavItem[];
  links: NavItem[];
};
