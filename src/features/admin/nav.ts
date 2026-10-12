export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/books", label: "Books" },
  { href: "/admin/import", label: "Import / export" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/sales", label: "Sales log" },
  { href: "/admin/searches", label: "Search terms" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/tools", label: "Demo data and storage" },
] as const;
