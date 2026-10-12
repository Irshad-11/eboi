"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Wordmark } from "@/components/wordmark";
import { IconMenu, IconExternal } from "@/components/icons";
import { Sheet } from "@/components/ui/sheet";
import { getBrowserClient } from "@/lib/supabase/browser";
import { ADMIN_NAV } from "../nav";

/**
 * Admin frame. Same tokens as the shop (paper, ink, rules), denser type.
 * Desktop: a ruled sidebar. Phone: a top bar and the nav in a bottom sheet.
 */
export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  async function signOut() {
    await getBrowserClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Admin">
      <ul>
        {ADMIN_NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive(item.href, "exact" in item && item.exact) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center border-l-4 px-3 font-semibold",
                isActive(item.href, "exact" in item && item.exact) ? "border-green-900 bg-paper-2" : "border-transparent hover:bg-paper-2",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  const footer = (
    <div className="space-y-2 border-t border-ink pt-4">
      <Link href="/" target="_blank" className="flex min-h-11 items-center gap-2 px-3 text-small hover:bg-paper-2">
        <IconExternal size={16} /> View the shop
      </Link>
      <p className="micro truncate px-3 text-ink-3">{email}</p>
      <button type="button" onClick={signOut} className="btn btn-quiet btn-sm px-3">
        Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden border-r-[3px] border-ink lg:flex lg:flex-col lg:gap-6 lg:p-5">
        <Link href="/admin" className="block">
          <Wordmark className="w-28 text-green-900" />
          <span className="micro mt-2 block text-ink-3">Admin</span>
        </Link>
        <div className="flex-1">{nav}</div>
        {footer}
      </aside>

      <header className="flex h-14 items-center justify-between border-b-[3px] border-ink px-4 lg:hidden">
        <Link href="/admin" className="flex items-baseline gap-2">
          <Wordmark className="h-6 w-auto text-green-900" />
          <span className="micro text-ink-3">Admin</span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex size-11 items-center justify-center" aria-label="Open admin menu">
          <IconMenu />
        </button>
      </header>
      <Sheet open={open} onClose={() => setOpen(false)} title="Admin" kicker="eBoi">
        {nav}
        <div className="mt-4">{footer}</div>
      </Sheet>

      <main id="main" className="min-w-0 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
