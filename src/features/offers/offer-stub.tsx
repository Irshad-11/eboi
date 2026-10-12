import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { IconArrow, IconClock } from "@/components/icons";
import { Countdown } from "./countdown";
import { describeDiscount, type ActiveOffer } from "./pricing";

type Props = {
  offer: ActiveOffer;
  symbol: string;
  href: string;
  appliesLabel: string;
  bookCount: number;
  large?: boolean;
};

/**
 * An offer as a torn-off price ticket: perforated edge, the discount set in
 * mono like a price gun label. Ochre lives here and on badges only.
 */
export function OfferStub({ offer, symbol, href, appliesLabel, bookCount, large }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-full flex-col border-2 border-ink bg-paper-raised transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5",
        large && "md:flex-row",
      )}
    >
      <div
        className={cn(
          "flex items-baseline justify-between gap-3 border-b-2 border-dashed border-ink bg-ochre px-4 py-3 text-green-950",
          large && "md:w-2/5 md:flex-col md:justify-center md:border-r-2 md:border-b-0 md:px-6",
        )}
      >
        <span className={cn("font-mono leading-none font-semibold tracking-tight", large ? "text-[2.25rem] md:text-[3.25rem]" : "text-[1.875rem]")}>
          {describeDiscount(offer.discount_type, offer.value, symbol).replace(" off", "")}
          <span className="ml-1 text-[0.45em] tracking-[0.12em] uppercase">off</span>
        </span>
        <span className="micro">{appliesLabel}</span>
      </div>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3 className="text-title font-semibold">{offer.title}</h3>
        {offer.banner_text && <p className="mt-1.5 text-small text-ink-2">{offer.banner_text}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
          <span className="micro inline-flex items-center gap-1.5 text-ochre-ink">
            <IconClock size={14} />
            {offer.end_at ? (
              offer.show_countdown ? (
                <Countdown endAt={offer.end_at} />
              ) : (
                `Until ${formatDate(offer.end_at)}`
              )
            ) : (
              "No end date"
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 text-small font-semibold">
            {bookCount} {bookCount === 1 ? "book" : "books"}
            <IconArrow size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
