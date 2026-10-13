import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronRight } from "./icons";

/** Section title with an optional "View all" link on the right. */
export function SectionHead({
  title,
  id,
  href,
  linkLabel = "View all",
  className,
  children,
}: {
  title: ReactNode;
  id?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-4 md:mb-4", className)}>
      <h2 id={id} className="text-lg font-semibold md:text-xl">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {children}
        {href && (
          <Link href={href} className="inline-flex min-h-9 items-center gap-0.5 text-sm font-semibold text-brand hover:underline">
            {linkLabel}
            <IconChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
