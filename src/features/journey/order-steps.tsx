import { cn } from "@/lib/cn";
import type { Step } from "@/features/settings/schema";

/** The order journey as numbered steps. Horizontal on desktop, a list on phones. */
export function OrderSteps({ steps, className }: { steps: Step[]; className?: string }) {
  return (
    <ol className={cn("grid gap-4 sm:grid-cols-2 lg:gap-0", steps.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4", className)}>
      {steps.map((s, i) => (
        <li key={`${i}-${s.title}`} className="relative flex gap-3 sm:[&:last-child:nth-child(odd)]:col-span-2 lg:flex-col lg:items-center lg:px-3 lg:text-center lg:[&:last-child:nth-child(odd)]:col-span-1">
          {i < steps.length - 1 && (
            <span className="absolute top-5 left-[calc(50%+1.5rem)] hidden h-px w-[calc(100%-3rem)] bg-line-2 lg:block" aria-hidden="true" />
          )}
          <span className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-base font-bold text-white">
            {i + 1}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">{s.title}</h3>
            {s.body && <p className="mt-0.5 text-sm text-text-3">{s.body}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
