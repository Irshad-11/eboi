import type { ReactNode } from "react";

/** Admin page title row: smaller than the shop's, same rules. */
export function AdminPageHead({ kicker, title, actions, children }: { kicker?: string; title: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-4">
      <div className="min-w-0">
        {kicker && <p className="label text-ink-3">{kicker}</p>}
        <h1 className="mt-1 text-headline font-semibold">{title}</h1>
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
