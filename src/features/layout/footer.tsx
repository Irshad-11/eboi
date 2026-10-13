import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { IconWhatsApp } from "@/components/icons";
import { formatWhatsappNumber, whatsappLink } from "@/features/whatsapp/message";
import type { SiteSettings } from "@/features/settings/schema";
import type { NavItem } from "./nav";

/** Store footer: link columns from the admin, categories, contact and payment methods. */
export function Footer({ settings, categories }: { settings: SiteSettings; categories: NavItem[] }) {
  const number = formatWhatsappNumber(settings.whatsapp_number);
  const year = new Date().getFullYear();
  const payments = settings.payment_methods.filter((p) => p.label);
  return (
    <footer className="mt-10 border-t border-line bg-white">
      <div className="container-x grid grid-cols-2 gap-x-4 gap-y-8 py-10 sm:grid-cols-3 lg:grid-cols-12 lg:gap-8">
        <div className="col-span-2 sm:col-span-3 lg:col-span-4">
          <Link href="/" aria-label={`${settings.site_name} home`} className="inline-block">
            <Wordmark className="h-7 w-auto text-brand-ink" />
          </Link>
          {settings.tagline && <p className="mt-2 text-sm text-text-3">{settings.tagline}</p>}
          {number && (
            <a
              href={whatsappLink(settings.whatsapp_number, "Hi eBoi!")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-whatsapp hover:text-whatsapp"
            >
              <IconWhatsApp size={18} className="text-whatsapp" />
              {number}
            </a>
          )}
          {payments.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold">We accept</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {payments.map((p) => (
                  <li key={p.label} className="rounded-md border border-line bg-muted px-2.5 py-1 text-sm font-semibold text-text-2">
                    {p.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {categories.length > 0 && (
          <FooterColumn title="Categories" links={categories.slice(0, 6)} className="lg:col-span-2" />
        )}
        {settings.footer_columns.map((col) => (
          <FooterColumn key={col.title} title={col.title} links={col.links} className="lg:col-span-2" />
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-4 text-sm text-text-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.site_name}
          </p>
          {settings.social_links.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {settings.social_links.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer me" className="hover:text-brand">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links, className }: { title: string; links: NavItem[]; className?: string }) {
  return (
    <nav aria-label={title} className={className}>
      <h2 className="text-base font-semibold">{title}</h2>
      <ul className="mt-2">
        {links.map((l) => (
          <li key={`${l.url}-${l.label}`}>
            {l.url.startsWith("/") ? (
              <Link href={l.url} className="inline-flex min-h-9 items-center text-sm text-text-2 hover:text-brand">
                {l.label}
              </Link>
            ) : (
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center text-sm text-text-2 hover:text-brand">
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
