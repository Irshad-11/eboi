import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Fonts for server-drawn images (OG cards, demo covers). Satori needs TTF or
 * WOFF, not WOFF2, so static instances live in src/assets/fonts/og
 * (included in the Vercel bundle by outputFileTracingIncludes).
 */
const dir = join(process.cwd(), "src/assets/fonts/og");

let cache: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: "normal" | "italic" }[]> | null = null;

function toArrayBuffer(b: Buffer): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

export function ogFonts() {
  cache ??= Promise.all([
    readFile(join(dir, "newsreader-display-600.ttf")),
    readFile(join(dir, "newsreader-text-400.ttf")),
    readFile(join(dir, "newsreader-display-italic-500.ttf")),
    readFile(join(dir, "ibm-plex-mono-500.woff")),
    // Fallback for the Taka sign (৳), which Plex Mono and Newsreader lack.
    readFile(join(dir, "hind-siliguri-bengali-500.woff")),
  ]).then(([display, text, italic, mono, hind]) => [
    { name: "Newsreader", data: toArrayBuffer(display), weight: 600 as const, style: "normal" as const },
    { name: "Newsreader", data: toArrayBuffer(text), weight: 400 as const, style: "normal" as const },
    { name: "Newsreader", data: toArrayBuffer(italic), weight: 500 as const, style: "italic" as const },
    { name: "Plex Mono", data: toArrayBuffer(mono), weight: 500 as const, style: "normal" as const },
    { name: "Hind Siliguri", data: toArrayBuffer(hind), weight: 500 as const, style: "normal" as const },
  ]);
  return cache;
}

/** Brand colours as plain strings (Satori cannot read CSS variables). */
export const OG = {
  paper: "#f4f0e6",
  paper2: "#ebe5d6",
  ink: "#14201a",
  ink3: "#5c6a61",
  green950: "#0a1f16",
  green900: "#0f2a1f",
  green800: "#163a2b",
  green700: "#1f4d3a",
  green300: "#94b8a3",
  green100: "#d9e5dc",
  ochre: "#b8862b",
} as const;
