import Link from "next/link";
import { cn } from "@/lib/cn";
import { CategoryIcon, IconLayers } from "@/components/icons";
import { BookCover } from "@/features/books/components/book-cover";
import { PriceText } from "@/features/books/components/price-tag";
import { coverUrl } from "@/features/books/cover";
import type { BookCard } from "@/features/books/types";
import type { CategoryItem } from "@/features/categories/queries";

/**
 * Category pages: an icon header plus a row of the other categories, so a
 * category always looks and navigates like a department.
 */
export function CategoryHeader({ category, all }: { category: CategoryItem; all: CategoryItem[] }) {
  const others = all.filter((c) => c.count > 0);
  return (
    <div className="mt-3">
      <div className="flex items-center gap-4 rounded-lg border border-line bg-white p-4 md:p-5">
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand md:size-16">
          <CategoryIcon name={category.icon} size={28} />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-text-3">Category</p>
          <h1 className="text-xl font-semibold md:text-2xl">{category.name}</h1>
          <p className="text-sm text-text-2">
            {category.count} {category.count === 1 ? "book" : "books"}
          </p>
        </div>
      </div>
      {others.length > 1 && (
        <nav aria-label="Other categories" className="scrollbar-none relative mt-3 -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <ul className="flex gap-2 pb-1">
            {others.map((c) => (
              <li key={c.slug} className="shrink-0">
                <Link
                  href={`/category/${c.slug}`}
                  aria-current={c.slug === category.slug ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap",
                    c.slug === category.slug ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand hover:text-brand",
                  )}
                >
                  <CategoryIcon name={c.icon} size={15} />
                  {c.name}
                  <span className={c.slug === category.slug ? "text-white/80" : "text-text-3"}>{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

const MOODS: Record<string, { box: string; muted: string }> = {
  forest: { box: "bg-brand text-white", muted: "text-white/80" },
  paper: { box: "bg-[#f3efe4] text-text", muted: "text-text-2" },
  ink: { box: "bg-text text-white", muted: "text-white/75" },
};

/** Collection pages: a coloured banner in the collection's mood, with its covers. */
export function CollectionHeader({ name, intro, mood, books }: { name: string; intro: string; mood: string; books: BookCard[]; symbol?: string }) {
  const m = MOODS[mood] ?? MOODS.forest!;
  const from = books.length ? books.reduce((a, b) => (b.pricing.final < a.pricing.final ? b : a)).pricing : null;
  return (
    <div className={cn("relative mt-3 overflow-hidden rounded-lg p-5 md:p-7", m.box)}>
      <div className="relative z-10 max-w-xl md:max-w-[55%]">
        <p className={cn("inline-flex items-center gap-1.5 text-sm", m.muted)}>
          <IconLayers size={16} />
          Collection
        </p>
        <h1 className="mt-1 text-xl font-semibold md:text-2xl">{name}</h1>
        {intro && <p className="mt-2 text-base leading-relaxed">{intro}</p>}
        <p className={cn("mt-3 text-sm", m.muted)}>
          {books.length} {books.length === 1 ? "book" : "books"}
          {from != null && (
            <>
              {" · from "}
              <PriceText pricings={[from]} />
            </>
          )}
        </p>
      </div>
      {books.length > 0 && (
        <div className="pointer-events-none absolute -right-2 -bottom-8 hidden w-[38%] max-w-[22rem] items-end justify-end md:flex" aria-hidden="true">
          {books.slice(0, 3).map((b, i) => (
            <BookCover
              key={b.id}
              src={coverUrl(b)}
              title={b.title}
              sizes="120px"
              className={cn("w-1/3 shrink-0 shadow-lg", i === 0 ? "rotate-[-6deg]" : i === 2 ? "rotate-[6deg]" : "z-10 -translate-y-4", i > 0 && "-ml-[8%]")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
