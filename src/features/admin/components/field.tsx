import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Label + control + hint/error. */
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

/** Kept for older imports: a titled group of fields in a two-column grid. */
export function FieldGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white">
      <div className="border-b border-line px-4 py-3 md:px-5">
        <h2 className="text-md font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-text-3">{description}</p>}
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 md:p-5">{children}</div>
    </section>
  );
}

/** A labelled on/off switch built on a checkbox. */
export function Toggle({ id, label, checked, onChange, hint }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-10 rounded-full bg-line-2 transition-colors peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
      <span>
        <span className="text-base font-medium">{label}</span>
        {hint && <span className="block text-sm text-text-3">{hint}</span>}
      </span>
    </label>
  );
}
