import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { IconClose } from "@/components/icons";
import { toQuery, type ShopParams } from "@/features/books/catalog";

export type Chip = { label: string; href: string };

/** Builds one removable chip per applied filter. */
export function buildChips(p: ShopParams, basePath: string, catName: (slug: string) => string, symbol: string, offerTitle?: string): Chip[] {
  const href = (next: Partial<ShopParams>) => `${basePath}${toQuery({ ...p, ...next, page: undefined })}`;
  const chips: Chip[] = [];
  if (p.q) chips.push({ label: `“${p.q}”`, href: href({ q: undefined }) });
  if (p.offer) chips.push({ label: offerTitle ?? "Offer", href: href({ offer: undefined }) });
  if (p.deals) chips.push({ label: "On offer", href: href({ deals: undefined }) });
  for (const c of p.category) chips.push({ label: catName(c), href: href({ category: p.category.filter((x) => x !== c) }) });
  for (const l of p.language) chips.push({ label: l, href: href({ language: p.language.filter((x) => x !== l) }) });
  for (const f of p.format) chips.push({ label: f, href: href({ format: p.format.filter((x) => x !== f) }) });
  if (p.min != null || p.max != null) {
    const label = p.min != null && p.max != null ? `${formatPrice(p.min, symbol)} – ${formatPrice(p.max, symbol)}` : p.min != null ? `From ${formatPrice(p.min, symbol)}` : `Up to ${formatPrice(p.max!, symbol)}`;
    chips.push({ label, href: href({ min: undefined, max: undefined }) });
  }
  return chips;
}

/** Applied filters as chips with a Clear all link. Scrolls sideways on phones. */
export function ActiveChips({ chips, clearHref, className }: { chips: Chip[]; clearHref: string; className?: string }) {
  if (!chips.length) return null;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ul className="scrollbar-none relative flex min-w-0 flex-1 gap-2 overflow-x-auto sm:flex-wrap">
        {chips.map((c) => (
          <li key={c.label} className="shrink-0">
            <Link
              href={c.href}
              scroll={false}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-line-2 bg-white pr-2 pl-3 text-sm hover:border-brand hover:text-brand"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label}
              <IconClose size={14} />
            </Link>
          </li>
        ))}
      </ul>
      <Link href={clearHref} scroll={false} className="shrink-0 text-sm font-semibold text-brand hover:underline">
        Clear all
      </Link>
    </div>
  );
}
