"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { CategoryIcon, IconChevronRight, IconClose, IconMenu, IconSearch } from "@/components/icons";
import { SearchBox } from "./search-box";
import type { HeaderNav, NavItem } from "./nav";
import { useFooterLinks } from "./footer-links-context";

/**
 * Phone header tools: the hamburger (left drawer with categories,
 * collections and page links) and a search icon that expands a search row.
 * Hidden from 1024px, where the full header shows.
 */
export function MobileHeaderTools({ nav, position }: { nav: HeaderNav; position: "start" | "end" }) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [lastPath, setLastPath] = useState<string | null>(null);
  const pathname = usePathname();
  const pageLinks = useFooterLinks();

  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (menu) setMenu(false);
    if (search) setSearch(false);
  }

  if (position === "end") {
    return (
      <>
        <button
          type="button"
          onClick={() => setSearch((s) => !s)}
          className="inline-flex size-11 items-center justify-center rounded-md hover:bg-muted lg:hidden"
          aria-label={search ? "Close search" : "Search"}
          aria-expanded={search}
        >
          {search ? <IconClose size={22} /> : <IconSearch size={22} />}
        </button>
        {search && (
          <div className="absolute inset-x-0 top-full border-b border-line bg-white px-4 py-3 shadow-md lg:hidden">
            <SearchBox autoFocus onDone={() => setSearch(false)} />
          </div>
        )}
      </>
    );
  }

  const close = () => setMenu(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMenu(true)}
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-md hover:bg-muted lg:hidden"
        aria-label="Open menu"
        aria-expanded={menu}
      >
        <IconMenu size={22} />
      </button>
      <Drawer open={menu} onClose={() => setMenu(false)} title="Menu">
        <nav aria-label="Menu" className="pb-6">
          <ul className="py-2">
            <Item item={{ label: "All books", url: "/shop" }} onPick={close} />
          </ul>
          {nav.categories.length > 0 && (
            <Group title="Categories">
              {nav.categories.map((c) => (
                <Item key={c.url} item={c} onPick={close} />
              ))}
            </Group>
          )}
          {nav.collections.length > 0 && (
            <Group title="Collections">
              {nav.collections.map((c) => (
                <Item key={c.url} item={c} onPick={close} />
              ))}
            </Group>
          )}
          {nav.links.length > 0 && (
            <Group title="More">
              {nav.links.map((c) => (
                <Item key={`${c.url}-${c.label}`} item={c} onPick={close} />
              ))}
            </Group>
          )}
          {pageLinks.map((col) => (
            <Group key={col.title} title={col.title}>
              {col.links.map((l) => (
                <Item key={`${l.url}-${l.label}`} item={l} onPick={close} />
              ))}
            </Group>
          ))}
        </nav>
      </Drawer>
    </>
  );
}

function Item({ item, onPick }: { item: NavItem; onPick: () => void }) {
  return (
    <li>
      <Link href={item.url} onClick={onPick} className="flex min-h-12 items-center gap-3 px-4 text-base hover:bg-muted">
        {item.icon && <CategoryIcon name={item.icon} size={18} className="text-brand" />}
        <span className="flex-1">{item.label}</span>
        <IconChevronRight size={16} className="text-text-3" />
      </Link>
    </li>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-2">
      <p className="px-4 pt-2 pb-1 text-sm font-semibold text-text-3">{title}</p>
      <ul>{children}</ul>
    </div>
  );
}
