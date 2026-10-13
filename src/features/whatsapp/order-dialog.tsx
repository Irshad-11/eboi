"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { IconCheck, IconCopy, IconWhatsApp } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { useShop } from "@/features/layout/shop-context";
import { AbroadPayment } from "@/features/region/abroad-payment";
import { useRegion } from "@/features/region/use-region";
import { copyText } from "./copy";
import { whatsappLink } from "./message";

type Props = {
  open: boolean;
  onClose: () => void;
  message: string;
  bookIds: string[];
  section: string;
  title?: string;
};

/**
 * The order step. The message is written already: copy it, or open WhatsApp
 * with it filled in. Below, the next three steps of the order journey.
 */
export function OrderDialog({ open, onClose, message, bookIds, section, title = "Order on WhatsApp" }: Props) {
  const { whatsapp_number, how_to_buy_steps, usd_payment_methods, usd_payment_note } = useShop();
  const { abroad } = useRegion();
  const showUsd = abroad && (usd_payment_methods.length > 0 || Boolean(usd_payment_note));
  const [copied, setCopied] = useState(false);
  const next = how_to_buy_steps.slice(2, 5);
  const each = (fn: (id: string | null) => void) => (bookIds.length ? bookIds.forEach(fn) : fn(null));

  async function onCopy() {
    if (await copyText(message)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
    each((bookId) => track("copy_click", { bookId, section }));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onCopy} className="btn btn-secondary btn-block" aria-live="polite">
            {copied ? <IconCheck size={18} className="text-brand" /> : <IconCopy size={18} />}
            {copied ? "Copied" : "Copy message"}
          </button>
          <a
            href={whatsappLink(whatsapp_number, message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => each((bookId) => track("whatsapp_open", { bookId, section }))}
            className="btn btn-primary btn-block"
          >
            <IconWhatsApp size={18} />
            Open WhatsApp
          </a>
        </div>
      }
    >
      <label htmlFor="order-message" className="field-label">
        Your message
      </label>
      <textarea
        id="order-message"
        readOnly
        value={message}
        rows={Math.min(9, message.split("\n").length + 1)}
        className="textarea resize-none bg-muted text-base"
        onFocus={(e) => e.currentTarget.select()}
      />
      {showUsd && <AbroadPayment className="mt-4" />}
      {!showUsd && next.length > 0 && (
        <ol className="mt-4 space-y-2">
          {next.map((s, i) => (
            <li key={s.title} className="flex gap-2.5 text-sm text-text-2">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                {i + 3}
              </span>
              <span>{s.title}</span>
            </li>
          ))}
        </ol>
      )}
    </Dialog>
  );
}
