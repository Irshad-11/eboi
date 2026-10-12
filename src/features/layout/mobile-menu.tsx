"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { IconMenu, IconArrow } from "@/components/icons";
import { formatWhatsappNumber } from "@/features/whatsapp/message";
import { HELP_NAV, MAIN_NAV } from "./nav";

/** Phone navigation as a bottom sheet: links land under the thumb. */
export function MobileMenu({ whatsappNumber }: { whatsappNumber: string }) {
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState<string | null>(null);
  const pathname = usePathname();

  // Close the sheet after navigating (adjusting state during render, not in an effect).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  const links = [...MAIN_NAV, ...HELP_NAV.filter((h) => !MAIN_NAV.some((m) => m.href === h.href))];
  const number = formatWhatsappNumber(whatsappNumber);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center hover:bg-paper-2 md:hidden"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <IconMenu />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Menu" kicker="eBoi">
        <form action="/shop" className="flex gap-2" role="search">
          <label htmlFor="menu-q" className="sr-only">
            Search books
          </label>
          <input id="menu-q" name="q" type="search" placeholder="Title, author or EB-0001" className="input" />
          <button className="btn btn-primary shrink-0 px-4" aria-label="Search">
            <IconArrow />
          </button>
        </form>
        <nav aria-label="Menu" className="mt-4">
          <ul>
            {links.map((l) => (
              <li key={l.href} className="border-t border-ink first:border-t-[3px]">
                <Link
                  href={l.href}
                  className="flex min-h-14 items-center justify-between text-title font-semibold"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                  <IconArrow />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {number && <p className="mt-4 text-small text-ink-3">WhatsApp: <span className="font-mono text-ink">{number}</span></p>}
      </Sheet>
    </>
  );
}
