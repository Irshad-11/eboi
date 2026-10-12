import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { formatWhatsappNumber, whatsappLink } from "@/features/whatsapp/message";
import type { SiteSettings } from "@/features/settings/schema";
import { HELP_NAV } from "./nav";

/**
 * Colophon. Dark green, a full-width wordmark set like a newspaper nameplate,
 * and the WhatsApp number in plain sight: it IS the checkout.
 */
export function Footer({ settings }: { settings: SiteSettings }) {
  const number = formatWhatsappNumber(settings.whatsapp_number);
  const year = new Date().getFullYear();
  return (
    <footer className="bg-green-950 text-paper">
      <div className="container-x grid gap-10 pt-14 pb-10 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <p className="label text-green-300">Questions before you buy?</p>
          <p className="mt-3 text-headline font-semibold">Ask on WhatsApp. A person answers.</p>
          {number && (
            <a
              href={whatsappLink(settings.whatsapp_number, "Hi eBoi, I have a question.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 items-center border-b-2 border-green-300 font-mono text-lead text-paper hover:border-paper"
            >
              {number}
            </a>
          )}
        </div>

        <nav aria-label="Shop" className="md:col-span-2 md:col-start-7">
          <p className="label text-green-300">Shop</p>
          <ul className="mt-3 space-y-1">
            <FooterLink href="/shop">All books</FooterLink>
            <FooterLink href="/collections/latest">Latest</FooterLink>
            <FooterLink href="/collections/best-selling">Best selling</FooterLink>
            <FooterLink href="/collections/most-viewed">Most viewed</FooterLink>
          </ul>
        </nav>

        <nav aria-label="Help" className="md:col-span-2">
          <p className="label text-green-300">Help</p>
          <ul className="mt-3 space-y-1">
            {HELP_NAV.map((l) => (
              <FooterLink key={l.href} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
            <FooterLink href="/about">About eBoi</FooterLink>
          </ul>
        </nav>

        <div className="md:col-span-2">
          {settings.social_links.length > 0 && (
            <>
              <p className="label text-green-300">Elsewhere</p>
              <ul className="mt-3 space-y-1">
                {settings.social_links.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer me" className="inline-flex min-h-11 items-center hover:underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="container-x" aria-hidden="true">
        <Wordmark className="block h-auto w-full text-green-800" title="" />
      </div>

      <div className="container-x flex flex-col gap-2 border-t border-green-800 py-5 text-green-300 sm:flex-row sm:items-center sm:justify-between">
        <p className="micro">
          © {year} {settings.site_name}. {settings.tagline}
        </p>
        <p className="micro">PDFs delivered on WhatsApp · Prices in Taka</p>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="inline-flex min-h-11 items-center hover:underline md:min-h-9">
        {children}
      </Link>
    </li>
  );
}
