import Link from "next/link";
import { IconChevronRight } from "@/components/icons";
import { JsonLd, breadcrumbJsonLd } from "./jsonld";

/** Visible breadcrumb plus its BreadcrumbList JSON-LD. */
export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-text-3">
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
          {items.map((it, i) => (
            <li key={it.path} className="flex min-w-0 items-center gap-1">
              {i > 0 && <IconChevronRight size={14} className="shrink-0" />}
              {i === items.length - 1 ? (
                <span aria-current="page" className="line-clamp-1 text-text-2">
                  {it.name}
                </span>
              ) : (
                <Link href={it.path} className="inline-flex min-h-8 items-center hover:text-brand hover:underline">
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
