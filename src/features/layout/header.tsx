import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { CategoryIcon, IconChevronDown, IconChevronRight, IconLayers, IconLink, IconMenu, IconPercent, IconTruck, IconWhatsApp } from "@/components/icons";
import type { FooterColumn } from "@/features/settings/schema";
import { whatsappLink } from "@/features/whatsapp/message";
import { ListCountLink } from "@/features/my-list/list-count";
import { SearchBox } from "./search-box";
import { MobileHeaderTools } from "./mobile-menu";
import { QUICK_LINKS, type HeaderNav, type NavItem } from "./nav";

type Props = { nav: HeaderNav; whatsappNumber: string; siteName: string; quickLinks?: FooterColumn[] };

/** Sticky store header: logo, search, WhatsApp, My List; category row below on desktop. */
export function Header({ nav, whatsappNumber, siteName, quickLinks = [] }: Props) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="container-x flex h-14 items-center gap-2 md:h-16 md:gap-4">
          <MobileHeaderTools nav={nav} position="start" />
          <Link href="/" className="flex shrink-0 items-start gap-1 py-2" aria-label={`${siteName} home. PDF books only`}>
            <Wordmark className="h-6 w-auto text-brand-ink md:h-7" />
            {/* Says at a glance that the shop sells PDF books only, no printed copies. */}
            <span className="pdf-only-badge -mt-0.5" title="We sell PDF books only. No printed copies.">
              PDF only
            </span>
          </Link>
          <SearchBox className="mx-auto hidden w-full max-w-2xl lg:block" />
          <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
            <MobileHeaderTools nav={nav} position="end" />
            {whatsappNumber && (
              <a
                href={whatsappLink(whatsappNumber, "Hi eBoi!")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-md px-2.5 text-whatsapp hover:bg-muted"
                aria-label="Chat on WhatsApp"
              >
                <IconWhatsApp size={22} />
                <span className="hidden text-sm font-semibold text-text xl:inline">WhatsApp</span>
              </a>
            )}
            <ListCountLink />
          </div>
        </div>
      </header>
      <DesktopNav nav={nav} quickLinks={quickLinks} />
    </>
  );
}

/**
 * Desktop navigation row: a Categories menu (green), the shop shortcuts,
 * Offers in red, a Collections menu, admin-pinned items and links. Menus
 * open on hover and on keyboard focus, with no script.
 */
function DesktopNav({ nav, quickLinks }: { nav: HeaderNav; quickLinks: FooterColumn[] }) {
  const columns = quickLinks.filter((c) => c.links.length > 0);
  const quick = QUICK_LINKS.filter((q) => (q.key !== "offers" || nav.hasOffers) && (q.key !== "free" || nav.hasFree));
  return (
    <nav aria-label="Shop" className="relative z-30 hidden border-b border-line bg-white lg:block">
      <ul className="container-x flex h-12 items-center gap-1">
        {nav.categories.length > 0 && (
          <li className="group relative mr-2 shrink-0">
            <button
              type="button"
              aria-haspopup="true"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              <IconMenu size={18} />
              Categories
              <IconChevronDown size={16} className="transition-transform group-focus-within:rotate-180 group-hover:rotate-180" />
            </button>
            <Dropdown wide>
              <ul className="grid grid-cols-3 gap-1">
                {nav.categories.map((c) => (
                  <li key={c.url}>
                    <MenuLink item={c} icon={<CategoryIcon name={c.icon ?? "book"} size={18} />} />
                  </li>
                ))}
              </ul>
              <Link href="/shop" className="mt-2 flex items-center justify-center rounded-md border-t border-line pt-3 text-sm font-semibold text-brand hover:underline">
                Browse all books
              </Link>
            </Dropdown>
          </li>
        )}
        {quick.map((q) => (
          <li key={q.key} className="shrink-0">
            <Link
              href={q.url}
              className={
                q.key === "offers"
                  ? "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold whitespace-nowrap text-sale hover:bg-sale-soft"
                  : q.key === "free"
                    ? "inline-flex h-9 items-center rounded-md border border-dashed border-[#12805c] px-3 text-sm font-semibold whitespace-nowrap text-[#12805c] hover:bg-[#e7f5ef]"
                    : "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-text hover:bg-muted hover:text-brand"
              }
            >
              {q.key === "offers" && <IconPercent size={16} />}
              {q.label}
            </Link>
          </li>
        ))}
        {nav.collections.length > 0 && (
          <li className="group relative shrink-0">
            <button
              type="button"
              aria-haspopup="true"
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-brand"
            >
              Collections
              <IconChevronDown size={16} className="transition-transform group-focus-within:rotate-180 group-hover:rotate-180" />
            </button>
            <Dropdown>
              <ul className="grid gap-1">
                {nav.collections.map((c) => (
                  <li key={c.url}>
                    <MenuLink item={c} icon={<IconLayers size={18} />} />
                  </li>
                ))}
              </ul>
            </Dropdown>
          </li>
        )}
        {[...nav.pinned, ...nav.links].length > 0 && (
          <li className="flex min-w-0 flex-1 items-center">
            <span className="mx-1 h-5 w-px shrink-0 bg-line-2" aria-hidden="true" />
            {/* Pinned shortcuts scroll sideways instead of squeezing the row. */}
            <ul className="scrollbar-none relative flex min-w-0 items-center gap-1 overflow-x-auto [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] pr-6">
              {[...nav.pinned, ...nav.links].map((item) => (
                <li key={`${item.url}-${item.label}`} className="shrink-0">
                  <Link href={item.url} className="inline-flex h-9 items-center rounded-md px-2.5 text-sm whitespace-nowrap text-text-2 hover:bg-muted hover:text-brand">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        )}
        {columns.length > 0 && (
          <li className="group relative ml-auto shrink-0">
            <button
              type="button"
              aria-haspopup="true"
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm whitespace-nowrap text-text-2 hover:bg-muted hover:text-brand"
            >
              <IconLink size={16} />
              Quick links
              <IconChevronDown size={16} className="transition-transform group-focus-within:rotate-180 group-hover:rotate-180" />
            </button>
            <Dropdown align="right" width={columns.length > 2 ? "w-[36rem]" : columns.length === 2 ? "w-[26rem]" : "w-60"}>
              <div className="grid gap-x-4 gap-y-3 p-1" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
                {columns.map((col) => (
                  <div key={col.title} className="min-w-0">
                    <p className="px-2 pb-1 text-sm font-semibold text-text-3">{col.title}</p>
                    <ul>
                      {col.links.map((l) => (
                        <li key={l.url + l.label}>
                          <Link href={l.url} className="group/ql flex min-h-10 items-center justify-between gap-2 rounded-md px-2 text-sm hover:bg-brand-soft hover:text-brand-ink">
                            <span className="truncate">{l.label}</span>
                            <IconChevronRight size={14} className="shrink-0 opacity-0 transition-opacity group-hover/ql:opacity-100" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Dropdown>
          </li>
        )}
        <li className={columns.length > 0 ? "shrink-0" : "ml-auto shrink-0"}>
          <Link href="/how-to-order" className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm whitespace-nowrap text-text-2 hover:bg-muted hover:text-brand">
            <IconTruck size={16} />
            How to order
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function Dropdown({ children, wide, align = "left", width }: { children: React.ReactNode; wide?: boolean; align?: "left" | "right"; width?: string }) {
  return (
    <div
      className={`invisible absolute top-full z-50 pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${align === "right" ? "right-0" : "left-0"}`}
    >
      <div className={`rounded-lg border border-line bg-white p-2 shadow-lg ${width ?? (wide ? "w-[40rem]" : "w-72")}`}>{children}</div>
    </div>
  );
}

function MenuLink({ item, icon }: { item: NavItem; icon: React.ReactNode }) {
  return (
    <Link href={item.url} className="flex min-h-11 items-center gap-3 rounded-md px-2.5 text-sm hover:bg-brand-soft hover:text-brand-ink">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-brand">{icon}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
      {item.count != null && <span className="text-xs text-text-3 tnum">{item.count}</span>}
    </Link>
  );
}
