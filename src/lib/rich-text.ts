import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Rich text (book descriptions, About, How to order, Terms) is stored as
 * HTML from the admin editor. It is sanitised when saved AND when rendered,
 * so even a row edited directly in the database cannot inject scripts.
 */

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "h4",
    "ul", "ol", "li", "a", "blockquote", "hr",
    "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    col: ["span"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  transformTags: {
    // Headings from pasted content are mapped down so a page keeps exactly one h1.
    h1: "h2",
    h5: "h4",
    h6: "h4",
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      const out: sanitizeHtml.Attributes = { href };
      if (external) {
        out.target = "_blank";
        out.rel = "noopener noreferrer nofollow";
      }
      return { tagName, attribs: out };
    },
  },
  exclusiveFilter: (frame) => frame.tag === "a" && !frame.attribs.href,
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** True when the stored value is already HTML (older rows hold plain text). */
export function looksLikeHtml(value: string): boolean {
  return /<\/?(p|h[1-6]|ul|ol|li|table|strong|em|a|br|blockquote)\b/i.test(value);
}

/** Converts plain text (blank line = paragraph, "- " = list item) to HTML. */
export function plainTextToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim());
      if (lines.every((l) => l.startsWith("- "))) return `<ul>${lines.map((l) => `<li>${escape(l.slice(2))}</li>`).join("")}</ul>`;
      return `<p>${lines.map(escape).join("<br>")}</p>`;
    })
    .join("");
}

/** Safe HTML for rendering, whatever the stored format. */
export function renderableHtml(value: string | null | undefined): string {
  if (!value) return "";
  return sanitizeRichText(looksLikeHtml(value) ? value : plainTextToHtml(value));
}

/** Plain text from HTML, for meta descriptions and search snippets. */
export function htmlToText(value: string | null | undefined): string {
  if (!value) return "";
  const html = looksLikeHtml(value) ? value : plainTextToHtml(value);
  return sanitizeHtml(html.replace(/<\/(p|li|h[2-4]|tr|blockquote)>/gi, " "), { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** The first paragraph as text (used by the SEO keyword checklist). */
export function firstParagraphText(value: string | null | undefined): string {
  if (!value) return "";
  const html = looksLikeHtml(value) ? value : plainTextToHtml(value);
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return htmlToText(m ? m[1] : html);
}
