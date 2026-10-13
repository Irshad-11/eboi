"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { track } from "@/features/analytics/client";
import { SECTIONS } from "@/config/analytics";

export type Slide = {
  id: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  href: string;
  alt: string;
  bg: string;
  fg: string;
  /** Pre-built <picture> markup for image slides (art-directed desktop/mobile). */
  picture: ReactNode | null;
};

const AUTOPLAY_MS = 6000;

/**
 * Banner carousel, following common carousel research (Baymard):
 * - autoplay only on devices that can hover, every 6 seconds, paused on
 *   hover/focus, and stopped for good once the visitor moves it themselves;
 * - no autoplay on touch screens; swipe instead;
 * - arrows on both sides, dots below, keyboard accessible;
 * - text slides are real HTML text; the frame keeps a fixed aspect ratio so
 *   the page never jumps while images load.
 */
export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = slides.length;

  const go = useCallback(
    (i: number, manual = true) => {
      setIndex(((i % count) + count) % count);
      if (manual) setStopped(true);
    },
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused || stopped) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(index + 1, false), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, stopped, count, go]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      data-section={SECTIONS.hero}
      className="group relative overflow-hidden rounded-lg bg-muted"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) touch.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        const t = e.changedTouches[0];
        touch.current = null;
        if (!start || !t) return;
        const dx = t.clientX - start.x;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(t.clientY - start.y)) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="flex transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="relative aspect-[3/2] w-full shrink-0 md:aspect-[16/5]"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            <SlideBody slide={s} />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text shadow-md transition-opacity hover:bg-white hover:text-brand focus-visible:opacity-100 md:inline-flex md:opacity-0 md:group-hover:opacity-100"
          >
            <IconChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text shadow-md transition-opacity hover:bg-white hover:text-brand focus-visible:opacity-100 md:inline-flex md:opacity-0 md:group-hover:opacity-100"
          >
            <IconChevronRight size={22} />
          </button>
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className="group/dot inline-flex h-6 items-center px-0.5"
              >
                <span className={cn("block h-2 rounded-full bg-white/70 shadow-sm transition-all", i === index ? "w-6 bg-white" : "w-2 group-hover/dot:bg-white")} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SlideBody({ slide: s }: { slide: Slide }) {
  const onClick = () => track("banner_click", { section: SECTIONS.hero, dedupe: `banner_click|${s.id}` });
  const isInternal = s.href.startsWith("/");

  if (s.picture) {
    const img = <span className="absolute inset-0">{s.picture}</span>;
    if (!s.href) return img;
    return isInternal ? (
      <Link href={s.href} onClick={onClick} className="absolute inset-0" aria-label={s.alt || s.title}>
        {img}
      </Link>
    ) : (
      <a href={s.href} onClick={onClick} className="absolute inset-0" aria-label={s.alt || s.title} target="_blank" rel="noopener noreferrer">
        {img}
      </a>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center" style={{ background: s.bg, color: s.fg }}>
      <div className="w-full px-6 sm:px-10 md:max-w-[60%] md:px-14">
        {s.title && <p className="text-xl leading-tight font-bold sm:text-2xl">{s.title}</p>}
        {s.subtitle && <p className="mt-2 line-clamp-3 text-base opacity-90 sm:text-md">{s.subtitle}</p>}
        {s.buttonLabel && s.href && (
          isInternal ? (
            <Link href={s.href} onClick={onClick} className="btn mt-4 bg-white text-brand-ink hover:bg-white/90">
              {s.buttonLabel}
            </Link>
          ) : (
            <a href={s.href} onClick={onClick} target="_blank" rel="noopener noreferrer" className="btn mt-4 bg-white text-brand-ink hover:bg-white/90">
              {s.buttonLabel}
            </a>
          )
        )}
      </div>
    </div>
  );
}
