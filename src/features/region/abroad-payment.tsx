"use client";

import { cn } from "@/lib/cn";
import { CopyButton } from "@/components/copy-button";
import { useShop } from "@/features/layout/shop-context";
import { useRegion } from "./use-region";

/**
 * Dollar payment instructions from Admin > Settings, shown only to visitors
 * outside Bangladesh (in the order dialog and on the How to order page).
 */
export function AbroadPayment({ className }: { className?: string }) {
  const { usd_payment_methods: methods, usd_payment_note: note } = useShop();
  const { abroad, countryName } = useRegion();
  if (!abroad || (!methods.length && !note)) return null;
  return (
    <section className={cn("rounded-md border border-line bg-white p-3", className)} aria-labelledby="usd-pay-title">
      <h3 id="usd-pay-title" className="text-base font-semibold">
        Paying from {countryName || "abroad"}
      </h3>
      {note && <p className="mt-1 text-sm whitespace-pre-line text-text-2">{note}</p>}
      {methods.length > 0 && (
        <ul className="mt-2 divide-y divide-line">
          {methods.map((m) => (
            <li key={m.label + m.number} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{m.label}</p>
                {m.number && <p className="break-all text-text-2">{m.number}</p>}
                {m.note && <p className="text-text-3">{m.note}</p>}
              </div>
              {m.number && <CopyButton value={m.number} className="shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
