import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { mediaUrl, skipOptimizer } from "@/lib/media";
import { coverUrl } from "../cover";
import type { BookCard } from "../types";
import { BookCover } from "./book-cover";

/** Image-led tile for a collection. Without an image, its first covers make a collage. */
export function CollectionTile({
  name,
  slug,
  imagePath,
  books,
}: {
  name: string;
  slug: string;
  imagePath: string | null;
  books: BookCard[];
}) {
  const img = mediaUrl(imagePath);
  return (
    <Link href={`/collections/${slug}`} className="group block overflow-hidden rounded-lg border border-line bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft">
        {img ? (
          <Image src={img} alt="" fill sizes="(min-width: 1024px) 300px, 50vw" unoptimized={skipOptimizer(img)} className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-end justify-center gap-2 px-4 pt-4">
            {books.slice(0, 3).map((b, i) => (
              <BookCover
                key={b.id}
                src={coverUrl(b)}
                title={b.title}
                sizes="96px"
                className={`w-[28%] transition-transform duration-300 ${i === 1 ? "-translate-y-3 group-hover:-translate-y-4" : "translate-y-2 group-hover:translate-y-1"}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <h3 className="line-clamp-1 text-base font-semibold group-hover:text-brand">{name}</h3>
        <span className="shrink-0 text-sm text-text-3">{books.length} books</span>
      </div>
    </Link>
  );
}

const MOOD_STYLES: Record<string, { box: string; button: string; muted: string }> = {
  forest: { box: "bg-brand text-white", button: "bg-white text-brand-ink hover:bg-white/90", muted: "text-white/80" },
  paper: { box: "bg-[#f3efe4] text-text", button: "bg-brand text-white hover:bg-brand-hover", muted: "text-text-2" },
  ink: { box: "bg-text text-white", button: "bg-white text-text hover:bg-white/90", muted: "text-white/75" },
};

/**
 * First card of a collection row on the home page: the collection's intro,
 * how many books, the lowest price, the best live discount and a few covers.
 */
export function CollectionLead({
  slug,
  intro,
  mood,
  books,
  symbol,
}: {
  slug: string;
  intro: string;
  mood: string;
  books: BookCard[];
  symbol: string;
}) {
  const style = MOOD_STYLES[mood] ?? MOOD_STYLES.forest!;
  const from = books.length ? Math.min(...books.map((b) => b.pricing.final)) : null;
  const bestOff = books.reduce((m, b) => (b.pricing.was && b.pricing.was > b.pricing.final ? Math.max(m, Math.round(((b.pricing.was - b.pricing.final) / b.pricing.was) * 100)) : m), 0);
  return (
    <Link href={`/collections/${slug}`} className={`group @container relative flex h-full min-h-[18rem] flex-col overflow-hidden rounded-lg p-5 ${style.box}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">
          {books.length} {books.length === 1 ? "book" : "books"}
        </span>
        {from != null && <span className={style.muted}>from {formatPrice(from, symbol)}</span>}
        {bestOff > 0 && <span className="badge badge-sale">Up to {bestOff}% off</span>}
      </div>
      {intro && <p className="relative z-10 mt-3 line-clamp-5 max-w-[17rem] text-base leading-relaxed @xl:max-w-sm">{intro}</p>}
      <span className={`btn btn-sm relative z-10 mt-4 self-start ${style.button}`}>Shop the collection</span>
      <div className="pointer-events-none absolute right-3 -bottom-6 flex w-[58%] max-w-[17rem] items-end justify-end @xl:right-8 @xl:max-w-[24rem]" aria-hidden="true">
        {books.slice(0, 3).map((b, i) => (
          <BookCover
            key={b.id}
            src={coverUrl(b)}
            title={b.title}
            sizes="90px"
            className={`w-1/3 shrink-0 shadow-lg transition-transform duration-300 ${i === 0 ? "rotate-[-6deg]" : i === 2 ? "rotate-[6deg]" : "z-10 -translate-y-3 group-hover:-translate-y-5"} ${i > 0 ? "-ml-[8%]" : ""}`}
          />
        ))}
      </div>
    </Link>
  );
}
