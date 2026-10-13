import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Fonts for server-drawn images. Share cards use Figtree (the site font);
 * demo covers use Newsreader and Plex Mono. Satori needs TTF or
 * WOFF, not WOFF2, so static instances live in src/assets/fonts/og
 * (included in the Vercel bundle by outputFileTracingIncludes).
 */
const dir = join(process.cwd(), "src/assets/fonts/og");

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 700; style: "normal" | "italic" };
let cache: Promise<OgFont[]> | null = null;

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
    readFile(join(dir, "figtree-400.woff")),
    readFile(join(dir, "figtree-600.woff")),
    readFile(join(dir, "figtree-700.woff")),
  ]).then(([display, text, italic, mono, hind, f400, f600, f700]): OgFont[] => [
    { name: "Newsreader", data: toArrayBuffer(display), weight: 600 as const, style: "normal" as const },
    { name: "Newsreader", data: toArrayBuffer(text), weight: 400 as const, style: "normal" as const },
    { name: "Newsreader", data: toArrayBuffer(italic), weight: 500 as const, style: "italic" as const },
    { name: "Plex Mono", data: toArrayBuffer(mono), weight: 500 as const, style: "normal" as const },
    { name: "Hind Siliguri", data: toArrayBuffer(hind), weight: 500 as const, style: "normal" as const },
    { name: "Figtree", data: toArrayBuffer(f400), weight: 400 as const, style: "normal" as const },
    { name: "Figtree", data: toArrayBuffer(f600), weight: 600 as const, style: "normal" as const },
    { name: "Figtree", data: toArrayBuffer(f700), weight: 700 as const, style: "normal" as const },
  ]);
  return cache;
}

/** Brand colours as plain strings (Satori cannot read CSS variables). */
export const OG = {
  paper: "#f4f0e6",
  ink: "#14201a",
  green950: "#0a1f16",
  green900: "#0f2a1f",
  green700: "#1f4d3a",
  green300: "#94b8a3",
  ochre: "#b8862b",
  // Site palette (share cards)
  page: "#f4f6f5",
  white: "#ffffff",
  line: "#e2e6e4",
  text: "#18211d",
  text2: "#45514b",
  text3: "#5f6b65",
  brand: "#1d5c42",
  brandSoft: "#e6f0eb",
  brandInk: "#0f2a1f",
  sale: "#d42d2d",
} as const;
