export const ADMIN_NAV = [
  {
    group: "",
    items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", exact: true }],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/books", label: "Books", icon: "book" },
      { href: "/admin/categories", label: "Categories", icon: "tag" },
      { href: "/admin/collections", label: "Collections", icon: "layers" },
      { href: "/admin/offers", label: "Offers", icon: "percent" },
      { href: "/admin/import", label: "Import / export", icon: "upload" },
    ],
  },
  {
    group: "Storefront",
    items: [
      { href: "/admin/banners", label: "Banners", icon: "image" },
      { href: "/admin/home", label: "Home layout", icon: "layout" },
      { href: "/admin/navigation", label: "Menus and footer", icon: "link" },
      { href: "/admin/pages", label: "Pages", icon: "file" },
    ],
  },
  {
    group: "Sales",
    items: [
      { href: "/admin/sales", label: "Sales log", icon: "receipt" },
      { href: "/admin/searches", label: "Search terms", icon: "search" },
    ],
  },
  {
    group: "Setup",
    items: [
      { href: "/admin/settings", label: "Settings", icon: "settings" },
      { href: "/admin/seo", label: "SEO", icon: "chart" },
      { href: "/admin/tools", label: "Demo data and storage", icon: "database" },
    ],
  },
] as const;
