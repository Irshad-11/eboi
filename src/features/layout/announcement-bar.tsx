"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { IconCheck, IconChevronRight, IconClose, IconCopy } from "@/components/icons";
import { copyText } from "@/features/whatsapp/copy";
import { useRegion } from "@/features/region/use-region";

type Props = {
  /** One message per line; several lines take turns. */
  text: string;
  /** Used instead of `text` for visitors outside Bangladesh, when set. */
  abroadText: string;
  link: string;
  code: string;
  endsAt: string | null;
  dismissible: boolean;
  bg: string;
  fg: string;
  image: string | null;
};

const ROTATE_MS = 5000;

/**
 * Top notice bar for offers and news. After the page loads it slides down
 * into its own space (it pushes the page, never covers it) and a soft glare
 * sweeps across it now and then. Options from Admin > Notices and features:
 * rotating messages, a coupon code to copy, a countdown (the bar hides when
 * it ends), a separate message for visitors abroad and an image or GIF.
 * Dismissal is remembered per message in this browser.
 */
export function AnnouncementBar({ text, abroadText, link, code, endsAt, dismissible, bg, fg, image }: Props) {
  const { abroad } = useRegion();
  const source = abroad && abroadText ? abroadText : text;
  const messages = source
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean);
  const key = `eboi_notice_${hash(text + abroadText + (image ?? "") + code + (endsAt ?? ""))}`;
  const [closing, setClosing] = useState(false);
  const [gone, setGone] = useState(false);
  const stored = useSyncExternalStore(noSubscribe, () => readFlag(key), () => false);
  const now = useSyncExternalStore(endsAt ? subscribeSecond : noSubscribe, secondSnapshot, () => null);
  const ended = endsAt != null && now != null && Date.parse(endsAt) <= now;

  if (gone || stored || ended || (!messages.length && !image)) return null;

  const imageOnly = Boolean(image) && !messages.length;
  const content = (
    <>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-set image or GIF of any size; shown as it is
        <img src={image} alt={imageOnly ? "Announcement" : ""} className={imageOnly ? "mx-auto max-h-14 w-auto max-w-full object-contain" : "h-6 w-auto shrink-0 rounded-sm object-contain"} />
      )}
      {messages.length > 0 && <Rotator messages={messages} />}
      {link && messages.length > 0 && <IconChevronRight size={14} className="shrink-0" />}
    </>
  );

  return (
    <div className="notice-bar" data-closing={closing || undefined} style={{ background: bg, color: fg }} onAnimationEnd={(e) => e.animationName === "notice-up" && setGone(true)}>
      <div className="notice-clip">
        <div className={`notice-slide container-x relative flex min-h-9 flex-wrap items-center justify-center gap-x-3 gap-y-0.5 py-1.5 text-center text-sm leading-snug ${dismissible ? "pr-10 pl-10" : ""}`}>
          {link ? (
            link.startsWith("/") ? (
              <Link href={link} className="inline-flex min-w-0 items-center gap-2 hover:underline">
                {content}
              </Link>
            ) : (
              <a href={link} className="inline-flex min-w-0 items-center gap-2 hover:underline" target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            )
          ) : (
            <div className="inline-flex min-w-0 items-center gap-2">{content}</div>
          )}
          {code && <CodeChip code={code} />}
          {endsAt && now != null && <span className="font-semibold tnum">Ends in {left(Date.parse(endsAt) - now)}</span>}
          {dismissible && (
            <button
              type="button"
              onClick={() => {
                setClosing(true);
                try {
                  localStorage.setItem(key, "1");
                } catch {
                  // ignore
                }
              }}
              className="absolute top-1/2 right-1 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md opacity-80 hover:bg-black/10 hover:opacity-100 md:right-4"
              aria-label="Dismiss notice"
            >
              <IconClose size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Several messages take turns, one every few seconds (paused on hover). */
function Rotator({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = messages.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  const current = messages[i % count]!;
  return (
    <span className="notice-msg font-medium" key={i % count} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} aria-live={count > 1 ? "off" : undefined}>
      {current}
    </span>
  );
}

/** Coupon code: tap to copy. */
function CodeChip({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(code)) {
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-sm border border-dashed border-current px-2 py-0.5 font-semibold hover:bg-white/15"
      aria-label={`Copy code ${code}`}
    >
      {done ? <IconCheck size={14} /> : <IconCopy size={14} />}
      {done ? "Copied" : code}
    </button>
  );
}

const noSubscribe = () => () => {};
function subscribeSecond(cb: () => void) {
  const t = setInterval(cb, 1000);
  return () => clearInterval(t);
}
const secondSnapshot = () => Math.floor(Date.now() / 1000) * 1000;

/** 2d 04:12:09 / 04:12:09 */
function left(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const pad = (n: number) => String(n).padStart(2, "0");
  const hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return d > 0 ? `${d}d ${hms}` : hms;
}

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
