import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Label + control + hint/error, with ids wired for screen readers. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A ruled group of fields, like a section of a printed form. */
export function FieldGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const id = `fg-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="grid gap-6 border-t-[3px] border-ink pt-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 id={id} className="text-title font-semibold">
          {title}
        </h2>
        {description && <p className="mt-2 text-small text-ink-3">{description}</p>}
      </div>
      <div className="grid content-start gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}
