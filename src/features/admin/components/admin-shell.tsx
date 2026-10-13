"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Wordmark } from "@/components/wordmark";
import {
  IconBookOpen,
  IconChart,
  IconDashboard,
  IconDatabase,
  IconExternal,
  IconFile,
  IconImage,
  IconLayers,
  IconLayout,
  IconLink,
  IconLogout,
  IconMenu,
  IconPercent,
  IconReceipt,
  IconSearch,
  IconSettings,
  IconTag,
  IconUpload,
} from "@/components/icons";
import { Drawer } from "@/components/ui/drawer";
import { signOut } from "../actions/auth";
import { ADMIN_NAV } from "../nav";

const ICONS = {
  dashboard: IconDashboard,
  book: IconBookOpen,
  tag: IconTag,
  layers: IconLayers,
  percent: IconPercent,
  upload: IconUpload,
  image: IconImage,
  layout: IconLayout,
  link: IconLink,
  file: IconFile,
  receipt: IconReceipt,
  search: IconSearch,
  settings: IconSettings,
  chart: IconChart,
  database: IconDatabase,
} as const;

/** Admin frame: sidebar on desktop, top bar with a drawer on phones. */
export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav aria-label="Admin" className="space-y-4">
      {ADMIN_NAV.map((g) => (
        <div key={g.group || "main"}>
          {g.group && <p className="px-3 pb-1 text-xs font-semibold text-text-3">{g.group}</p>}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActive(item.href, "exact" in item && item.exact);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-2.5 rounded-md px-3 text-base",
                      active ? "bg-brand-soft font-semibold text-brand" : "text-text-2 hover:bg-muted hover:text-text",
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const account = (
    <div className="space-y-1 border-t border-line pt-3">
      <Link href="/" target="_blank" className="flex min-h-10 items-center gap-2.5 rounded-md px-3 text-base text-text-2 hover:bg-muted">
        <IconExternal size={18} /> View store
      </Link>
      <form action={signOut}>
        <button className="flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 text-base text-text-2 hover:bg-muted">
          <IconLogout size={18} /> Sign out
        </button>
      </form>
      <p className="truncate px-3 pt-1 text-xs text-text-3">{email}</p>
    </div>
  );

  return (
    <div className="min-h-dvh bg-page lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-5 overflow-y-auto border-r border-line bg-white p-4 lg:flex">
        <Link href="/admin" className="flex items-baseline gap-2 px-3 pt-1">
          <Wordmark className="h-6 w-auto text-brand-ink" />
          <span className="text-sm text-text-3">Admin</span>
        </Link>
        <div className="flex-1">{nav}</div>
        {account}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-white px-3 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-icon" aria-label="Open admin menu">
          <IconMenu size={22} />
        </button>
        <Link href="/admin" className="flex items-baseline gap-2">
          <Wordmark className="h-5 w-auto text-brand-ink" />
          <span className="text-sm text-text-3">Admin</span>
        </Link>
      </header>
      <Drawer open={open} onClose={() => setOpen(false)} title="Admin">
        <div className="space-y-4 p-3">
          {nav}
          {account}
        </div>
      </Drawer>

      <main id="main" className="min-w-0 px-4 py-5 md:px-8 md:py-7">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
