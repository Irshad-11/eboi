import Link from "next/link";
import { SECTIONS } from "@/config/analytics";
import { formatCompact, formatDate } from "@/lib/format";
import { langOf } from "@/lib/bangla";
import { IconEye, IconMessage, IconStar, IconTruck, IconWallet } from "@/components/icons";
import { SectionHead } from "@/components/section-head";
import { TrackSection } from "@/features/analytics/track-section";
import { BookCover } from "@/features/books/components/book-cover";
import { coverUrl } from "@/features/books/cover";
import type { BookCard } from "@/features/books/types";

/** Four promises under the banner: what makes buying here easy. */
export function TrustStrip({ responseTime, payments }: { responseTime: string; payments: string[] }) {
  const items = [
    { icon: <IconEye size={22} />, title: "Free preview", text: "Read the first pages before you pay" },
    { icon: <IconTruck size={22} />, title: "Delivered on WhatsApp", text: `Your PDF in the same chat` },
    { icon: <IconWallet size={22} />, title: `Pay with ${payments.length ? payments.join(" or ") : "mobile banking"}`, text: "Send Money, no card needed" },
    { icon: <IconMessage size={22} />, title: "A real person replies", text: `Usually within ${responseTime}` },
  ];
  return (
    <section className="container-x pt-4" aria-label="Why buy here">
      <ul className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-white p-2 sm:gap-0 sm:p-0 lg:grid-cols-4 lg:divide-x lg:divide-line">
        {items.map((it) => (
          <li key={it.title} className="flex items-center gap-3 rounded-md p-2 sm:p-4">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">{it.icon}</span>
            <div className="min-w-0">
              <p className="text-sm leading-snug font-semibold sm:text-base">{it.title}</p>
              <p className="hidden text-sm text-text-3 sm:block">{it.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The shop in numbers: copies sold, rating, catalogue size, reply time. Real figures only. */
export function StatsStrip({ stats, responseTime }: { stats: { books: number; sold: number; ratings: number; avg: number }; responseTime: string }) {
  if (!stats.books) return null;
  const items = [
    stats.sold > 0 && { value: `${formatCompact(stats.sold)}+`, label: "happy readers" },
    stats.avg > 0 && { value: `${stats.avg.toFixed(1)}★`, label: `average from ${formatCompact(stats.ratings)} ratings` },
    { value: String(stats.books), label: stats.books === 1 ? "book to choose from" : "books to choose from" },
    { value: responseTime, label: "typical reply time" },
  ].filter(Boolean) as { value: string; label: string }[];
  return (
    <section className="container-x py-4 md:py-5" aria-label="The shop in numbers">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-brand-ink/90 lg:grid-cols-4">
        {items.map((it) => (
          <li key={it.label} className="bg-brand px-4 py-5 text-center text-white md:py-6">
            <p className="text-2xl font-bold tnum">{it.value}</p>
            <p className="mt-1 text-sm text-white/85">{it.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Review = { id: string; author_name: string; rating: number; body: string; review_date: string; book: BookCard };

/** "What readers say": recent four- and five-star reviews, each linked to its book. */
export function Testimonials({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  return (
    <TrackSection name={SECTIONS.detailReviews} className="container-x py-4 md:py-5" aria-labelledby="readers-title">
      <SectionHead id="readers-title" title="What readers say" />
      <ul className="scrollbar-none relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
        {reviews.slice(0, 4).map((r) => (
          <li key={r.id} className="w-[80%] max-w-[20rem] shrink-0 snap-start md:w-auto md:max-w-none">
            <figure className="flex h-full flex-col rounded-lg border border-line bg-white p-4">
              <div className="flex text-star" aria-label={`${r.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <IconStar key={n} size={16} filled={n <= r.rating} className={n <= r.rating ? "" : "text-line-2"} />
                ))}
              </div>
              <blockquote lang={langOf(r.body)} className="mt-2 line-clamp-5 flex-1 text-base text-text-2">
                “{r.body}”
              </blockquote>
              <figcaption className="mt-3 flex items-center gap-3 border-t border-line pt-3">
                <BookCover src={coverUrl(r.book)} title={r.book.title} sizes="40px" className="w-10 shrink-0" />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">{r.author_name}</p>
                  <Link href={`/books/${r.book.slug}`} lang={langOf(r.book.title)} className="line-clamp-1 text-text-3 hover:text-brand">
                    on {r.book.title} · {formatDate(r.review_date)}
                  </Link>
                </div>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </TrackSection>
  );
}
