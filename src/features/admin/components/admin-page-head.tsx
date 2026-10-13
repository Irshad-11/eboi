import Link from "next/link";
import type { ReactNode } from "react";
import { IconChevronLeft } from "@/components/icons";

/** Admin page title row with optional back link and actions. */
export function AdminPageHead({ title, back, meta, actions }: { title: string; back?: { href: string; label: string }; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm text-text-3 hover:text-brand">
          <IconChevronLeft size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
          {meta && <div className="mt-1 text-sm text-text-3">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** White panel with an optional title, used for every admin form group and list. */
export function AdminCard({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-line bg-white ${className ?? ""}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 md:px-5">
          <div>
            {title && <h2 className="text-md font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-text-3">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}
