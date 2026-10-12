// Copies the pdf.js worker into /public so the preview viewer can load it from
// our own origin. WHY: bundler-specific `new URL(..., import.meta.url)` tricks
// differ between Turbopack and webpack; a static file works everywhere.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// The legacy build is used on purpose: it is transpiled for older Android
// browsers, which are common among our readers.
const src = join(root, "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs");
const dest = join(root, "public/pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.warn("[copy-pdf-worker] pdfjs-dist not installed yet, skipping.");
  process.exit(0);
}
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("[copy-pdf-worker] public/pdf.worker.min.mjs ready.");
