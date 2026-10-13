import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Inline status message. */
export function Notice({ tone = "info", children, className }: { tone?: "info" | "ok" | "error"; children: ReactNode; className?: string }) {
  const styles = {
    info: "border-line-2 bg-muted text-text-2",
    ok: "border-brand/25 bg-brand-soft text-brand",
    error: "border-sale/30 bg-sale-soft text-sale",
  }[tone];
  return (
    <div className={cn("rounded-md border px-3 py-2.5 text-sm break-words", styles, className)} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
