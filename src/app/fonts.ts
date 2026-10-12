import localFont from "next/font/local";

/*
 * Fonts are self-hosted through next/font/local (files from Fontsource, SIL
 * Open Font License). WHY local instead of next/font/google: builds never
 * depend on reaching Google, and next/font still adds preload, swap and
 * size-adjusted fallbacks so text never jumps (good for CLS).
 *
 * 1. Newsreader: one variable serif with an optical-size axis. At 72px it is a
 *    sharp, high-contrast display face with real personality; at 17px it is a
 *    calm reading face. One family does both jobs, like a newspaper.
 * 2. IBM Plex Mono: Book IDs, prices and labels. Reads like a typed stock
 *    card or a price sticker in a print shop.
 * Bangla: Hind Siliguri, Bengali subset only. Its unicode-range means the
 *    browser downloads it only when a page actually contains Bangla text, and
 *    it is chained after Newsreader in every font stack.
 */

export const newsreader = localFont({
  src: [
    { path: "../assets/fonts/site/newsreader-latin-opsz-normal.woff2", style: "normal", weight: "200 800" },
    { path: "../assets/fonts/site/newsreader-latin-opsz-italic.woff2", style: "italic", weight: "200 800" },
  ],
  variable: "--font-newsreader",
  display: "swap",
  fallback: ["Iowan Old Style", "Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const plexMono = localFont({
  src: [
    { path: "../assets/fonts/site/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/site/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../assets/fonts/site/ibm-plex-mono-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  fallback: ["ui-monospace", "Menlo", "monospace"],
  adjustFontFallback: false,
});

export const hindSiliguri = localFont({
  src: [
    { path: "../assets/fonts/site/hind-siliguri-bengali-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/site/hind-siliguri-bengali-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../assets/fonts/site/hind-siliguri-bengali-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-hind",
  display: "swap",
  // Not preloaded: most pages have no Bangla, so they should not pay for it.
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0951-0952, U+0964-0965, U+0980-09FE, U+1CD0, U+1CD2, U+1CD5-1CD6, U+1CD8, U+1CE1, U+1CEA, U+1CED, U+1CF2, U+1CF5-1CF7, U+200C-200D, U+20B9, U+25CC, U+A8F1" }],
  adjustFontFallback: false,
});

export const fontVariables = `${newsreader.variable} ${plexMono.variable} ${hindSiliguri.variable}`;
