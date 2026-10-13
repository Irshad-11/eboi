import localFont from "next/font/local";

/*
 * Self-hosted through next/font/local (SIL Open Font License files from
 * Fontsource): preload, font-display swap and size-adjusted fallbacks, with
 * no build-time dependency on Google.
 *
 * Figtree: one friendly, very readable sans-serif for the whole UI.
 * Hind Siliguri: Bangla text only. Its unicode-range means the browser
 * downloads it only on pages that actually contain Bangla.
 */

export const figtree = localFont({
  src: [
    { path: "../assets/fonts/site/figtree-latin-wght-normal.woff2", style: "normal", weight: "300 900" },
    { path: "../assets/fonts/site/figtree-latin-ext-wght-normal.woff2", style: "normal", weight: "300 900" },
  ],
  variable: "--font-figtree",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

/**
 * Just the Taka sign (৳), subset from Hind Siliguri (about 1 KB). Prices
 * appear on every page; without this, every page would pull in the full
 * Bangla font for one character.
 */
export const takaSign = localFont({
  src: [
    { path: "../assets/fonts/site/taka-sign-400.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/site/taka-sign-600.woff2", weight: "500 900", style: "normal" },
  ],
  variable: "--font-taka",
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+09F3" }],
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
  preload: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0951-0952, U+0964-0965, U+0980-09FE, U+1CD0, U+1CD2, U+1CD5-1CD6, U+1CD8, U+1CE1, U+1CEA, U+1CED, U+1CF2, U+1CF5-1CF7, U+200C-200D, U+20B9, U+25CC, U+A8F1",
    },
  ],
  adjustFontFallback: false,
});

export const fontVariables = `${figtree.variable} ${takaSign.variable} ${hindSiliguri.variable}`;
