import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/features/seo/breadcrumbs";
import type { PaymentMethod } from "@/features/settings/schema";
import { IconWhatsApp } from "./icons";

/** Breadcrumbs and the page title for content pages. */
export function PageHeader({ title, path, crumb, children }: { title: string; path: string; crumb: string; children?: ReactNode }) {
  return (
    <div className="container-x pt-4">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: crumb, path }]} />
      <h1 className="mt-3 text-xl font-semibold md:text-2xl">{title}</h1>
      {children}
    </div>
  );
}

/**
 * Two-column body for text pages: the content on the left, a short
 * contact panel on the right (below the content on phones).
 */
export function InfoLayout({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <div className="container-x mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 [&>*]:h-full">{children}</div>
      <aside>{aside}</aside>
    </div>
  );
}

/** Short side panel: contact on WhatsApp, payment methods, link to the shop. */
export function OrderPanel({ whatsappHref, payments, responseTime }: { whatsappHref: string | null; payments: PaymentMethod[]; responseTime: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-md font-semibold">Questions?</h2>
      <p className="mt-1 text-sm text-text-2">Message us on WhatsApp. We reply within {responseTime}.</p>
      {payments.length > 0 && (
        <p className="mt-3 text-sm text-text-2">
          We accept <span className="font-semibold text-text">{payments.map((p) => p.label).join(", ")}</span>
        </p>
      )}
      <div className="mt-4 grid gap-2">
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block">
            <IconWhatsApp size={18} /> Message us
          </a>
        )}
        <Link href="/shop" className="btn btn-secondary btn-block">
          Browse books
        </Link>
      </div>
    </div>
  );
}
