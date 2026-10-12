import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { IconSearch } from "@/components/icons";
import { ListCountLink } from "@/features/my-list/list-count";
import { MAIN_NAV } from "./nav";
import { MobileMenu } from "./mobile-menu";

type Props = {
  tagline: string;
  announcement: string | null;
  whatsappNumber: string;
};

/**
 * Masthead. Not sticky: on a 360px phone every pixel goes to the books, and
 * the book page has its own sticky buy bar where it matters.
 */
export function Header({ tagline, announcement, whatsappNumber }: Props) {
  return (
    <>
      {announcement && (
        <div className="bg-green-900 text-paper">
          <p className="container-x flex min-h-9 items-center gap-3 py-1.5 text-small">
            <span className="micro shrink-0 text-green-300">Notice</span>
            <span className="min-w-0">{announcement}</span>
          </p>
        </div>
      )}
      <header className="border-b-[3px] border-ink">
        <div className="container-x flex h-16 items-center gap-4 md:h-20 md:gap-6">
          <Link href="/" className="-my-2 py-2" aria-label="eBoi home">
            <Wordmark className="h-[1.85rem] w-auto text-green-900 md:h-[2.35rem]" />
          </Link>
          <p className="micro hidden border-l border-ink pl-4 text-ink-2 lg:block">{tagline}</p>

          <nav aria-label="Main" className="ml-auto hidden items-center md:flex">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center px-3 font-semibold underline-offset-[0.35em] hover:underline hover:decoration-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              href="/shop#search"
              className="inline-flex size-11 items-center justify-center hover:bg-paper-2"
              aria-label="Search books"
            >
              <IconSearch />
            </Link>
            <ListCountLink />
            <MobileMenu whatsappNumber={whatsappNumber} />
          </div>
        </div>
      </header>
    </>
  );
}
