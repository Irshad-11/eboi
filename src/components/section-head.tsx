import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconArrow } from "./icons";

type Props = {
  kicker?: string;
  title: ReactNode;
  id?: string;
  href?: string;
  linkLabel?: string;
  /** Rule weight above the heading. Varies by section to vary the rhythm. */
  rule?: "thick" | "double" | "none";
  size?: "display" | "headline";
  className?: string;
  children?: ReactNode;
};

/** Kicker, big heading, optional "see all" link, sitting on a printed rule. */
export function SectionHead({
  kicker,
  title,
  id,
  href,
  linkLabel = "See all",
  rule = "thick",
  size = "headline",
  className,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pt-4",
        rule === "thick" && "border-t-[3px] border-ink",
        rule === "double" && "rule-double",
        className,
      )}
    >
      <div className="min-w-0">
        {kicker && <p className="label text-ink-3">{kicker}</p>}
        <h2 id={id} className={cn("mt-2 font-semibold", size === "display" ? "text-display" : "text-headline")}>
          {title}
        </h2>
        {children}
      </div>
      {href && (
        <Link href={href} className="group inline-flex min-h-11 items-center gap-2 font-semibold">
          <span className="link">{linkLabel}</span>
          <IconArrow size={18} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
