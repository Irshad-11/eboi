"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { track } from "./client";

type Props = HTMLAttributes<HTMLElement> & {
  name: string;
  bookId?: string;
  as?: "section" | "div" | "aside";
  children: ReactNode;
};

/**
 * Wraps a page section so we know it was actually seen (half visible), and
 * tags it with data-section so clicks inside are attributed to it. Children
 * stay server-rendered: this component only adds an observer.
 */
export function TrackSection({ name, bookId, as: Tag = "section", children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          track("section_view", { section: name, bookId });
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [name, bookId]);

  return (
    <Tag ref={ref as never} data-section={name} {...rest}>
      {children}
    </Tag>
  );
}
