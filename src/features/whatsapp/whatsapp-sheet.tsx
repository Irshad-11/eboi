"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { IconChat, IconCheck, IconCopy } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { useShop } from "@/features/layout/shop-context";
import { copyText } from "./copy";
import { formatWhatsappNumber, whatsappLink } from "./message";

type Props = {
  open: boolean;
  onClose: () => void;
  message: string;
  /** Books in the message, for copy/open tracking. */
  bookIds: string[];
  section: string;
  title?: string;
};

/**
 * The purchase step. The message is already written; the buyer only copies
 * it or opens WhatsApp with it filled in. Nothing to type, nothing to forget.
 */
export function WhatsAppSheet({ open, onClose, message, bookIds, section, title = "Your message is ready" }: Props) {
  const { whatsapp_number, delivery_note } = useShop();
  const [copied, setCopied] = useState(0);
  const number = formatWhatsappNumber(whatsapp_number);

  const forEachBook = (fn: (id: string | null) => void) => (bookIds.length ? bookIds.forEach(fn) : fn(null));

  async function onCopy() {
    const ok = await copyText(message);
    if (ok) setCopied((n) => n + 1);
    forEachBook((bookId) => track("copy_click", { bookId, section }));
  }

  return (
    <Sheet open={open} onClose={onClose} title={title} kicker="Order on WhatsApp">
      <p className="text-small text-ink-2">
        Copy it and paste it in WhatsApp, or tap Open WhatsApp and press send. We reply with payment details.
      </p>

      <div className="relative mt-4">
        <pre
          className="max-h-[38dvh] overflow-auto border-l-4 border-green-900 bg-paper-raised px-4 py-3 font-mono text-[0.875rem] leading-relaxed whitespace-pre-wrap text-ink"
          aria-label="Message to send"
        >
          {message}
        </pre>
        {copied > 0 && (
          <span
            key={copied}
            className="animate-stamp pointer-events-none absolute top-3 right-3 border-2 border-green-700 px-2 py-0.5 label text-green-700"
            role="status"
          >
            Copied
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onCopy} className="btn btn-outline btn-block">
          {copied ? <IconCheck /> : <IconCopy />}
          {copied ? "Copied. Now paste it" : "Copy message"}
        </button>
        <a
          href={whatsappLink(whatsapp_number, message)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => forEachBook((bookId) => track("whatsapp_open", { bookId, section }))}
          className="btn btn-primary btn-block"
        >
          <IconChat />
          Open WhatsApp
        </a>
      </div>

      <div className="mt-5 space-y-1 border-t border-paper-3 pt-4 text-small text-ink-3">
        {number ? (
          <p>
            Or message us yourself: <span className="font-mono text-ink">{number}</span>
          </p>
        ) : null}
        {delivery_note && <p>{delivery_note}</p>}
      </div>
    </Sheet>
  );
}
