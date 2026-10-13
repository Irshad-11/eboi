import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { IconWhatsApp } from "@/components/icons";
import { whatsappLink } from "@/features/whatsapp/message";
import { ListCountLink } from "@/features/my-list/list-count";
import { SearchBox } from "./search-box";
import { MobileHeaderTools } from "./mobile-menu";
import type { HeaderNav } from "./nav";

type Props = { nav: HeaderNav; whatsappNumber: string; siteName: string };

/** Sticky store header: logo, search, WhatsApp, My List; category row below on desktop. */
export function Header({ nav, whatsappNumber, siteName }: Props) {
  const row = [...nav.categories, ...nav.collections, ...nav.links];
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="container-x flex h-14 items-center gap-2 md:h-16 md:gap-4">
          <MobileHeaderTools nav={nav} position="start" />
          <Link href="/" className="flex shrink-0 items-center py-2" aria-label={`${siteName} home`}>
            <Wordmark className="h-6 w-auto text-brand-ink md:h-7" />
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
      {row.length > 0 && (
        <nav aria-label="Categories" className="hidden border-b border-line bg-white lg:block">
          <ul className="container-x scrollbar-none relative flex items-center gap-1 overflow-x-auto">
            <li>
              <Link href="/shop" className="inline-flex h-11 items-center px-3 text-sm font-semibold whitespace-nowrap hover:text-brand">
                All books
              </Link>
            </li>
            {row.map((item) => (
              <li key={`${item.url}-${item.label}`}>
                <Link href={item.url} className="inline-flex h-11 items-center px-3 text-sm whitespace-nowrap text-text-2 hover:text-brand">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
