import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { DemoBook } from "./data";

/**
 * Demo preview PDFs with pdf-lib: a title page, a contents page and a few
 * text pages, A5, marked "Demo preview" in every footer. Standard PDF fonts
 * only cover Latin text, so Bangla books get English placeholder text.
 */
const W = 420;
const H = 595;
const M = 48;
const INK = rgb(0.078, 0.125, 0.102);
const GREY = rgb(0.36, 0.42, 0.38);
const GREEN = rgb(0.06, 0.165, 0.12);

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Keep only characters the standard WinAnsi fonts can encode. */
const latin = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, "").replace(/\s+/g, " ").trim();

function footer(page: PDFPage, n: number, font: PDFFont, title: string) {
  page.drawLine({ start: { x: M, y: 40 }, end: { x: W - M, y: 40 }, thickness: 0.8, color: INK });
  page.drawText(`${latin(title)} · Demo preview · eBoi`, { x: M, y: 26, size: 7.5, font, color: GREY });
  page.drawText(String(n), { x: W - M - font.widthOfTextAtSize(String(n), 8), y: 26, size: 8, font, color: GREY });
}

export async function renderDemoPreview(b: DemoBook, pages = 7): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${latin(b.coverTitle ?? b.title)} (demo preview)`);
  doc.setProducer("eBoi demo data");
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const title = latin(b.coverTitle ?? b.title);

  // 1. Title page
  const t = doc.addPage([W, H]);
  t.drawRectangle({ x: 0, y: H - 160, width: W, height: 160, color: GREEN });
  t.drawText("DEMO PREVIEW", { x: M, y: H - 60, size: 9, font: mono, color: rgb(0.58, 0.72, 0.64) });
  let y = H - 230;
  for (const line of wrap(title, serifBold, 30, W - 2 * M)) {
    t.drawText(line, { x: M, y, size: 30, font: serifBold, color: INK });
    y -= 34;
  }
  y -= 8;
  for (const line of wrap(latin(b.subtitle), italic, 13, W - 2 * M)) {
    t.drawText(line, { x: M, y, size: 13, font: italic, color: GREY });
    y -= 17;
  }
  t.drawText(latin(b.coverAuthor ?? b.author), { x: M, y: 90, size: 14, font: serif, color: INK });
  t.drawLine({ start: { x: M, y: 80 }, end: { x: W - M, y: 80 }, thickness: 3, color: INK });

  // 2. Contents
  const c = doc.addPage([W, H]);
  c.drawText("Contents", { x: M, y: H - 80, size: 22, font: serifBold, color: INK });
  y = H - 120;
  const toc = latin(b.toc.replace(/\n/g, " | ")).split(" | ").filter(Boolean);
  for (const [i, line] of (toc.length ? toc : ["Chapter one", "Chapter two", "Chapter three"]).entries()) {
    c.drawText(line.slice(0, 48), { x: M, y, size: 11.5, font: serif, color: INK });
    c.drawText(String(7 + i * 18), { x: W - M - 18, y, size: 10, font: mono, color: GREY });
    y -= 22;
  }
  footer(c, 2, mono, title);

  // 3+. Text pages
  const paras = b.previewText.length ? b.previewText.map(latin) : ["Preview text."];
  for (let p = 3; p <= pages; p++) {
    const page = doc.addPage([W, H]);
    y = H - 72;
    if (p === 3) {
      page.drawText("Chapter one", { x: M, y, size: 9, font: mono, color: GREY });
      y -= 30;
      page.drawText(toc[0]?.replace(/^\d+\.\s*/, "").slice(0, 40) || "Beginning", { x: M, y, size: 20, font: serifBold, color: INK });
      y -= 36;
    }
    let i = p;
    while (y > 70) {
      const para = paras[i % paras.length]!;
      for (const line of wrap(para, serif, 11, W - 2 * M)) {
        if (y < 70) break;
        page.drawText(line, { x: M, y, size: 11, font: serif, color: INK, lineHeight: 15 });
        y -= 15.5;
      }
      y -= 9;
      i++;
    }
    footer(page, p, mono, title);
  }
  return doc.save();
}
