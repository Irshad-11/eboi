import Link from "next/link";
import { JsonLd, breadcrumbJsonLd } from "./jsonld";

/** Visible breadcrumb plus its BreadcrumbList JSON-LD, always in sync. */
export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="micro text-ink-3">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((it, i) => (
            <li key={it.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === items.length - 1 ? (
                <span aria-current="page" className="line-clamp-1 text-ink-2">
                  {it.name}
                </span>
              ) : (
                <Link href={it.path} className="inline-flex min-h-8 items-center hover:text-ink hover:underline">
                  {it.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
