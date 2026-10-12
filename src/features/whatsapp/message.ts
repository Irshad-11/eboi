import { formatPrice } from "@/lib/format";
import { TEMPLATE_TOKENS } from "@/features/settings/schema";
import type { Pricing } from "@/features/offers/pricing";

/**
 * Builds the WhatsApp text from the admin's templates. Pure functions: the
 * same code renders the message in the sheet and in the admin preview.
 */

export type MessageBook = { title: string; book_code: string; slug: string; pricing: Pricing };

/** "৳200 (was ৳250, Monsoon Week offer)" */
export function priceLine(p: Pricing, symbol: string): string {
  const now = formatPrice(p.final, symbol);
  if (p.was == null) return now;
  const why = p.offer ? `, ${p.offer.title} offer` : "";
  return `${now} (was ${formatPrice(p.was, symbol)}${why})`;
}

function fill(template: string, values: Record<string, string>): string {
  let out = template;
  for (const [token, value] of Object.entries(values)) out = out.split(token).join(value);
  return out.trim();
}

export function buildSingleMessage(template: string, book: MessageBook, symbol: string, siteUrl: string): string {
  return fill(template, {
    [TEMPLATE_TOKENS.title]: book.title,
    [TEMPLATE_TOKENS.id]: book.book_code,
    [TEMPLATE_TOKENS.price]: priceLine(book.pricing, symbol),
    [TEMPLATE_TOKENS.url]: `${siteUrl}/books/${book.slug}`,
  });
}

export function buildListMessage(template: string, books: MessageBook[], symbol: string, siteUrl: string): string {
  const lines = books.map((b, i) => `${i + 1}. ${b.title} (${b.book_code}) ${priceLine(b.pricing, symbol)}`);
  const total = books.reduce((sum, b) => sum + b.pricing.final, 0);
  const codes = books.map((b) => b.book_code).join(",");
  return fill(template, {
    [TEMPLATE_TOKENS.list]: lines.join("\n"),
    [TEMPLATE_TOKENS.total]: formatPrice(total, symbol),
    // A shareable list link: the shop owner can open it and see the covers.
    [TEMPLATE_TOKENS.url]: `${siteUrl}/my-list?books=${codes}`,
    // Single-book tokens are cleared if someone reuses them by mistake.
    [TEMPLATE_TOKENS.title]: "",
    [TEMPLATE_TOKENS.id]: "",
    [TEMPLATE_TOKENS.price]: "",
  });
}

/** wa.me link with the text pre-filled. Without a number, WhatsApp asks whom to send to. */
export function whatsappLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** 8801712345678 -> +880 1712-345678 */
export function formatWhatsappNumber(number: string): string {
  const d = number.replace(/\D/g, "");
  if (d.startsWith("880") && d.length === 13) return `+880 ${d.slice(3, 7)}-${d.slice(7)}`;
  return d ? `+${d}` : "";
}

/** Trim a full book down to what the client-side buy button needs. */
export function toMessageBook<T extends MessageBook & { id: string }>(b: T): MessageBook & { id: string } {
  return { id: b.id, title: b.title, book_code: b.book_code, slug: b.slug, pricing: b.pricing };
}
