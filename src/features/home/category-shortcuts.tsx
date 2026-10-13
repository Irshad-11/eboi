import Link from "next/link";
import Image from "next/image";
import { SECTIONS } from "@/config/analytics";
import { HOME } from "@/config/site";
import { mediaUrl } from "@/lib/media";
import { CategoryIcon } from "@/components/icons";
import { SectionHead } from "@/components/section-head";
import { TrackSection } from "@/features/analytics/track-section";
import type { CategoryItem } from "@/features/categories/queries";

/** Round category tiles: image or icon. Swipe on phones, one row on desktop. */
export function CategoryShortcuts({ categories }: { categories: CategoryItem[] }) {
  const list = categories.filter((c) => c.show_on_home && c.count > 0).slice(0, HOME.categoryCount);
  // Desktop shows one row; with more than 8, the rest are one click away in the shop.
  if (list.length < 2) return null;
  return (
    <TrackSection name={SECTIONS.categories} className="container-x py-4 md:py-5" aria-labelledby="cat-title">
      <SectionHead id="cat-title" title="Shop by category" href="/shop" linkLabel="All books" />
      {/* Phones: swipe row of round icons. Desktop: one full-width row of tiles with book counts. */}
      <ul
        className="scrollbar-none relative -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:gap-3 md:mx-0 md:grid md:grid-cols-[repeat(var(--cols-md),minmax(0,1fr))] md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
        style={{ ["--cols-md" as string]: list.length <= 6 ? list.length : Math.ceil(list.length / 2), ["--cols" as string]: list.length <= 8 ? list.length : Math.ceil(list.length / 2) }}
      >
        {list.map((c) => {
          const img = mediaUrl(c.image_path);
          return (
            <li key={c.slug} className="w-[5.5rem] shrink-0 snap-start sm:w-24 md:w-auto">
              <Link
                href={`/category/${c.slug}`}
                className="group flex flex-col items-center gap-2 rounded-lg p-2 text-center hover:bg-white md:h-full md:border md:border-line md:bg-white md:px-2 md:py-3 md:transition-shadow md:hover:border-brand md:hover:shadow-md lg:px-3 lg:py-4"
              >
                <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-full border border-line bg-white text-brand transition-colors group-hover:border-brand group-hover:bg-brand-soft sm:size-18">
                  {img ? <Image src={img} alt="" fill sizes="72px" className="object-cover" /> : <CategoryIcon name={c.icon} size={26} />}
                </span>
                <span className="line-clamp-2 text-sm leading-tight font-medium group-hover:text-brand lg:text-base">{c.name}</span>
                <span className="hidden text-sm text-text-3 md:block">
                  {c.count} {c.count === 1 ? "book" : "books"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </TrackSection>
  );
}
