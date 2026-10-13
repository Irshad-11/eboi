"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { IconChevronRight, IconClose } from "@/components/icons";

type Props = { text: string; link: string; dismissible: boolean; bg: string; fg: string; image: string | null };

/**
 * Top notice bar for offers and news. Colours are set in the admin (red by
 * default); an optional image or GIF sits beside the text, or fills the bar
 * when there is no text. Dismissal is remembered per message in this browser.
 */
export function AnnouncementBar({ text, link, dismissible, bg, fg, image }: Props) {
  const key = `eboi_notice_${hash(text + (image ?? ""))}`;
  const [dismissed, setHidden] = useState(false);
  const stored = useSyncExternalStore(noSubscribe, () => readFlag(key), () => false);

  if (dismissed || stored) return null;

  const imageOnly = Boolean(image) && !text;
  const content = (
    <>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-set image or GIF of any size; shown as it is
        <img src={image} alt={imageOnly ? "Announcement" : ""} className={imageOnly ? "mx-auto max-h-14 w-auto max-w-full object-contain" : "h-6 w-auto shrink-0 rounded-sm object-contain"} />
      )}
      {text && <span className="font-medium">{text}</span>}
      {link && text && <IconChevronRight size={14} className="shrink-0" />}
    </>
  );

  return (
    <div style={{ background: bg, color: fg }}>
      <div className={`container-x relative flex min-h-9 items-center justify-center py-1.5 text-center text-sm ${dismissible ? "pr-10 pl-10" : ""}`}>
        {link ? (
          link.startsWith("/") ? (
            <Link href={link} className="inline-flex items-center gap-2 hover:underline">
              {content}
            </Link>
          ) : (
            <a href={link} className="inline-flex items-center gap-2 hover:underline" target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          )
        ) : (
          <p className="inline-flex items-center gap-2">{content}</p>
        )}
        {dismissible && (
          <button
            type="button"
            onClick={() => {
              setHidden(true);
              try {
                localStorage.setItem(key, "1");
              } catch {
                // ignore
              }
            }}
            className="absolute right-1 inline-flex size-8 items-center justify-center rounded-md opacity-80 hover:bg-black/10 hover:opacity-100 md:right-4"
            aria-label="Dismiss notice"
          >
            <IconClose size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

const noSubscribe = () => () => {};

function readFlag(key: string): boolean {
  try {
    return Boolean(localStorage.getItem(key));
  } catch {
    // storage blocked: the bar simply stays visible
    return false;
  }
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
