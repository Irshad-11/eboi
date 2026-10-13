"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { IconChevronRight, IconClose } from "@/components/icons";

/** Top notice bar. Dismissal is remembered per message text in this browser. */
export function AnnouncementBar({ text, link, dismissible }: { text: string; link: string; dismissible: boolean }) {
  const key = `eboi_notice_${hash(text)}`;
  const [dismissed, setHidden] = useState(false);
  const stored = useSyncExternalStore(noSubscribe, () => readFlag(key), () => false);

  if (dismissed || stored) return null;

  const content = (
    <>
      <span>{text}</span>
      {link && <IconChevronRight size={14} className="shrink-0" />}
    </>
  );

  return (
    <div className="bg-brand-ink text-white">
      <div className={`container-x relative flex min-h-9 items-center justify-center py-1.5 text-center text-sm ${dismissible ? "pr-10 pl-10" : ""}`}>
        {link ? (
          link.startsWith("/") ? (
            <Link href={link} className="inline-flex items-center gap-1 hover:underline">
              {content}
            </Link>
          ) : (
            <a href={link} className="inline-flex items-center gap-1 hover:underline" target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          )
        ) : (
          <p className="inline-flex items-center gap-1">{content}</p>
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
            className="absolute right-1 inline-flex size-8 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white md:right-4"
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
