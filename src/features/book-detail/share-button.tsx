"use client";

import { useState } from "react";
import { IconCheck, IconShare } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { copyText } from "@/features/whatsapp/copy";

/** Native share sheet where available, otherwise copies the link. */
export function ShareButton({ title, url, bookId }: { title: string; url: string; bookId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-secondary btn-icon"
      aria-label={copied ? "Link copied" : "Share"}
      title={copied ? "Link copied" : "Share"}
      onClick={async () => {
        track("share_click", { bookId, section: "detail_buy_box" });
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
            return;
          } catch {
            // cancelled or blocked: fall back to copying
          }
        }
        if (await copyText(url)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
    >
      {copied ? <IconCheck size={20} className="text-brand" /> : <IconShare size={20} />}
    </button>
  );
}
