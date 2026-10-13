"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { IconCheck, IconCopy } from "./icons";
import { copyText } from "@/features/whatsapp/copy";

/** Small copy button with a "Copied" confirmation. */
export function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(value)) {
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        }
      }}
      className={cn("btn btn-secondary btn-sm", className)}
      aria-live="polite"
    >
      {done ? <IconCheck size={16} className="text-brand" /> : <IconCopy size={16} />}
      {done ? "Copied" : label}
    </button>
  );
}
