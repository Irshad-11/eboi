/** Primary navigation. One list feeds the header, mobile menu and footer. */
export const MAIN_NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/how-to-buy", label: "How to buy" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
] as const;

export const HELP_NAV = [
  { href: "/how-to-buy", label: "How to buy" },
  { href: "/faq", label: "Questions" },
  { href: "/terms", label: "Refunds and terms" },
  { href: "/my-list", label: "My List" },
] as const;
