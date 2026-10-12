import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Inline status message. Colour is never the only signal: each has a label. */
export function Notice({ tone = "info", children, className }: { tone?: "info" | "ok" | "error"; children: ReactNode; className?: string }) {
  const styles = {
    info: "border-ink-3 bg-paper-2",
    ok: "border-green-700 bg-green-100",
    error: "border-rust bg-rust-wash",
  }[tone];
  const label = { info: "Note", ok: "Done", error: "Problem" }[tone];
  return (
    <div className={cn("border-l-4 p-4 text-small", styles, className)} role={tone === "error" ? "alert" : "status"}>
      <span className="label mr-2">{label}</span>
      {children}
    </div>
  );
}
