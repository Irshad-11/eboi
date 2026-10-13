"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconCheck, IconChevronDown, IconCopy } from "@/components/icons";
import { copyText } from "@/features/whatsapp/copy";
import { AdminCard } from "./admin-page-head";
import { Field } from "./field";

export type SeoContext = {
  siteName: string;
  siteUrl: string;
  tagline: string;
  titleTemplate: string;
  metaDescription: string;
  keywords: string[];
  currency: string;
  payments: string[];
  responseTime: string;
  abroad: boolean;
  bookCount: number;
  priceMin: number;
  priceMax: number;
  categories: { name: string; path: string }[];
  collections: { name: string; path: string; intro: string }[];
  languages: string[];
  topSearches: string[];
  zeroSearches: string[];
};

export type SeoBook = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  slug: string;
  author: string;
  category: string;
  language: string;
  tags: string[];
  pages: number | null;
  price: number;
  status: string;
  description: string;
  highlights: string[];
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  seoKeywords: string[];
};

type Draft = { title: string; author: string; category: string; language: string; price: string; notes: string };

const list = (items: string[], empty = "none yet") => (items.length ? items.join(", ") : empty);

/** The facts every prompt starts with, so the AI's advice fits this shop. */
function siteBlock(c: SeoContext): string {
  return [
    "ABOUT MY WEBSITE",
    `- Shop: ${c.siteName} (${c.siteUrl}). Tagline: "${c.tagline}".`,
    "- What it sells: PDF books only (digital files, no printed copies). Every book page has a free preview of the first pages.",
    `- How people buy: they tap "Order on WhatsApp", send a ready-made message, pay by ${c.payments.length ? c.payments.join(" or ") : "bKash or Nagad"} (Send Money), and get the PDF in the same WhatsApp chat. We usually reply within ${c.responseTime}. There is no cart or card checkout.`,
    `- Market: Bangladesh first. Readers search in Bangla, English and Banglish (Bangla written in English letters).${c.abroad ? " Visitors from other countries see US dollar prices." : ""}`,
    `- Catalogue: ${c.bookCount} published books, prices from ${c.currency}${c.priceMin} to ${c.currency}${c.priceMax}. Some books can be free or on offer for a limited time.`,
    `- Categories (page address): ${c.categories.length ? c.categories.map((x) => `${x.name} (${x.path})`).join(", ") : "none yet"}.`,
    `- Collections: ${c.collections.length ? c.collections.map((x) => `${x.name} (${x.path})`).join(", ") : "none yet"}. Also automatic pages: /collections/best-selling, /collections/latest, /collections/free.`,
    `- Book languages: ${list(c.languages)}.`,
    `- Page addresses: /books/<link-name> for each book, /shop for all books, /how-to-order, /faq, /about.`,
    `- Page title format: "${c.titleTemplate}" (%s is the page's own title).`,
    `- Current site description: "${c.metaDescription}"`,
    `- Current site keywords: ${list(c.keywords)}.`,
    `- What visitors searched on my site in the last 30 days: ${list(c.topSearches)}.`,
    `- Searches that found nothing (books or words I am missing): ${list(c.zeroSearches)}.`,
    "- Already done by the website, so do not suggest these again: sitemap.xml, robots.txt, canonical links, Book and Product structured data with price and rating, a share image for every book, Google Search Console verification, mobile-friendly fast pages.",
    "",
    "RULES FOR YOUR ANSWER",
    "- Write for real readers in Bangladesh first, search engines second. No keyword stuffing.",
    "- Mix keywords naturally: English, Bangla (বাংলা) and common Banglish spellings people actually type.",
    '- Do not use "free download", "crack" or similar words for paid books. Use them only if I say the book is free.',
    "- Never invent reviews, ratings, sales numbers, awards or quotes.",
    "- Keep to limits: SEO title up to 60 characters, meta description 140 to 155 characters, link name (slug) lowercase-with-dashes up to 5 words.",
  ].join("\n");
}

function bookBlock(b: SeoBook | null, d: Draft, currency: string): string {
  if (!b) {
    return [
      "THE BOOK (not published yet)",
      `- Title: ${d.title || "(fill in)"}`,
      `- Author: ${d.author || "(unknown)"}`,
      `- Category: ${d.category || "(choose the best fit from my categories)"}`,
      `- Language: ${d.language || "(fill in)"}`,
      d.price ? `- Price: ${currency}${d.price}` : "",
      `- What it is about: ${d.notes || "(write 3 to 5 lines about the book)"}`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `THE BOOK (Book ID ${b.code}, ${b.status === "published" ? "already published" : "draft"})`,
    `- Title: ${b.title}${b.subtitle ? ` | Subtitle: ${b.subtitle}` : ""}`,
    `- Author: ${b.author || "(unknown)"} | Category: ${b.category} | Language: ${b.language}${b.pages ? ` | ${b.pages} pages` : ""} | Price: ${b.price > 0 ? `${currency}${b.price}` : "Free"}`,
    `- Current link: /books/${b.slug}`,
    `- Tags now: ${list(b.tags)}`,
    `- Highlights now: ${list(b.highlights)}`,
    `- Description now: ${b.description || "(empty)"}`,
    `- SEO now: title "${b.seoTitle || "(automatic)"}", description "${b.seoDescription || "(automatic)"}", focus keyword "${b.focusKeyword || "(none)"}", keywords ${list(b.seoKeywords)}`,
  ].join("\n");
}

type PromptDef = { id: string; title: string; when: string; needs?: "book" | "page"; build: (args: { c: SeoContext; book: SeoBook | null; draft: Draft; page: string }) => string };

const PROMPTS: PromptDef[] = [
  {
    id: "book",
    title: "New book: full SEO pack",
    when: "Before you publish a book, or to improve an old one. Paste the answer into the book's form.",
    needs: "book",
    build: ({ c, book, draft }) =>
      [
        `You are an SEO expert for an online PDF bookshop in Bangladesh. Help me prepare one book page so it ranks on Google and gets clicks.`,
        "",
        siteBlock(c),
        "",
        bookBlock(book, draft, c.currency),
        "",
        "GIVE ME, using exactly these headings (they match the fields in my admin):",
        "1. Focus keyword: the one search phrase this page should rank for. Explain in one line why.",
        "2. SEO title: up to 60 characters, focus keyword near the start. Give 3 options and mark the best.",
        "3. Meta description: 140 to 155 characters, includes the focus keyword, says it is a PDF with a free preview and WhatsApp delivery. Give 2 options.",
        "4. Link name (slug): short, lowercase, words joined with dashes.",
        "5. Keywords: 10 to 15, one per line, mixing English, Bangla and Banglish spellings.",
        "6. Tags: 5 to 8 short topic words that visitors would click.",
        "7. Highlights: 3 to 5 short bullet points (what the reader gets).",
        "8. Description: 250 to 400 words in simple HTML (<p>, <h2>, <ul><li>, <strong>). Start with who it is for, then what is inside, then a short paragraph on how to get it on WhatsApp. Use the focus keyword in the first paragraph and one <h2>, naturally.",
        "9. Cover alt text: one sentence, format: <Title> by <Author>, book cover.",
        "10. Best category and collections for it from my lists, plus 3 other books or pages it should link to.",
        "11. 3 FAQ questions and short answers a buyer would ask about this book.",
        "12. A Facebook post and a WhatsApp status text to share the book (Bangla or Banglish, with the link).",
        "13. 5 search phrases I should watch for this page in Google Search Console.",
      ].join("\n"),
  },
  {
    id: "page",
    title: "Category or collection page",
    when: "When a category or collection should rank for a topic (e.g. “IELTS PDF books”).",
    needs: "page",
    build: ({ c, page }) =>
      [
        `You are an SEO expert for an online PDF bookshop in Bangladesh. Help me optimise one listing page.`,
        "",
        siteBlock(c),
        "",
        `THE PAGE: ${page || "(pick a category or collection)"}`,
        "",
        "GIVE ME:",
        "1. The main search phrase this page should rank for, and 5 related phrases (English, Bangla, Banglish).",
        "2. SEO title (up to 60 characters), 2 options.",
        "3. Meta description (140 to 155 characters), 2 options.",
        "4. A short intro shown at the top of the page: up to 600 characters, friendly, mentions PDF and WhatsApp ordering.",
        "5. A longer description for the bottom of the page: 200 to 350 words in simple HTML with one <h2> and a short list.",
        "6. Which books or topics are missing from this page, based on what visitors searched.",
        "7. 3 FAQ questions with short answers for this topic.",
      ].join("\n"),
  },
  {
    id: "site",
    title: "Home page and site-wide settings",
    when: "Once at the start, then every few months. Fill Admin > SEO with the answer.",
    build: ({ c }) =>
      [
        `You are an SEO expert. Review the site-wide SEO settings of my online PDF bookshop in Bangladesh and improve them.`,
        "",
        siteBlock(c),
        "",
        "GIVE ME:",
        "1. Home page SEO title (up to 60 characters), 3 options.",
        "2. Site description (140 to 155 characters), 3 options.",
        "3. A better page title format if mine can be improved (it must contain %s).",
        "4. 15 to 20 site keywords mixing English, Bangla and Banglish.",
        "5. SEO titles and descriptions for: /shop, /how-to-order, /faq, /about.",
        "6. 8 FAQ questions and answers about buying PDF books on WhatsApp in Bangladesh (payment, delivery time, preview, refunds, reading on phone).",
        "7. An About page outline that builds trust (who we are, how delivery works, contact).",
        "8. The 5 most important things to fix first, in order.",
      ].join("\n"),
  },
  {
    id: "keywords",
    title: "Keyword research for a topic",
    when: "Before adding books in a new topic, or when planning which books to add next.",
    needs: "page",
    build: ({ c, page }) =>
      [
        `You are an SEO keyword researcher who knows how people in Bangladesh search on Google, in English, Bangla and Banglish.`,
        "",
        siteBlock(c),
        "",
        `TOPIC: ${page || "(type a topic, category or collection)"}`,
        "",
        "GIVE ME a table with 25 to 40 search phrases for this topic, with columns:",
        "phrase | language (English/Bangla/Banglish) | what the searcher wants (learn, buy, compare, free) | how competitive (low/medium/high, your estimate) | which of my pages should target it (a book, a category, a collection or a new page).",
        "",
        "Then:",
        "1. The 5 best phrases to target first and why.",
        "2. Book ideas I should add, based on the phrases and on my searches that found nothing.",
        "3. Phrases to avoid (piracy words, misleading free download phrases) and safer alternatives.",
      ].join("\n"),
  },
  {
    id: "console",
    title: "Monthly Google Search Console review",
    when: "Once a month. Export Performance > Queries and Pages from Search Console and paste them under the prompt.",
    build: ({ c }) =>
      [
        `You are an SEO analyst. Below is my Google Search Console data for the last 28 days. Find quick wins for my PDF bookshop.`,
        "",
        siteBlock(c),
        "",
        "MY SEARCH CONSOLE DATA (queries and pages with clicks, impressions, CTR, position):",
        "[paste the exported Queries table here]",
        "[paste the exported Pages table here]",
        "",
        "GIVE ME:",
        "1. Queries in positions 5 to 20 with many impressions: which page should rank, and a new SEO title and meta description for it.",
        "2. Pages with a low click rate for their position: rewrite their title and description.",
        "3. Queries where no page of mine fits: should I add a book, a collection or improve a category page?",
        "4. Pages losing clicks compared with before, if visible, and likely reasons.",
        "5. A short to-do list for this month, most valuable first.",
      ].join("\n"),
  },
  {
    id: "content",
    title: "Promotion and backlink plan",
    when: "To bring visitors from outside Google (Facebook, YouTube, groups) and earn links.",
    build: ({ c }) =>
      [
        `You are a growth marketer for small online shops in Bangladesh. Make a 4-week plan to bring readers to my PDF bookshop and earn links that help SEO.`,
        "",
        siteBlock(c),
        "",
        "GIVE ME:",
        "1. A week-by-week plan: what to post, where (Facebook page, Facebook groups, YouTube Shorts, TikTok, blogs), and which of my pages each post links to.",
        "2. 10 ready post texts in Bangla or Banglish, each with a call to read the free preview.",
        "3. 10 websites, blogs, groups or communities in Bangladesh where a link to my shop would be natural, and what to offer them.",
        "4. How to ask happy buyers for an honest review without breaking any rules.",
        "5. Simple numbers to track each week.",
      ].join("\n"),
  },
];

type Tip = { title: string; points: string[] };
const TIPS: { group: string; tips: Tip[] }[] = [
  {
    group: "Before you publish a book",
    tips: [
      {
        title: "The 10-point checklist",
        points: [
          "Run the “New book: full SEO pack” prompt above and fill the book's SEO fields with the answer.",
          "Focus keyword in the SEO title (near the start), the first paragraph of the description and one heading.",
          "SEO title up to 60 characters; meta description 140 to 155. The book form shows a live Google preview.",
          "Short, readable link name: /books/ielts-writing-without-panic, not /books/book-12-final.",
          "A clear cover (2:3, at least 600 px wide) with alt text “Title by Author, book cover”.",
          "Upload a 5 to 10 page preview PDF. Pages with a preview keep visitors longer.",
          "Description of 250+ words written for people: who it is for, what is inside, how to get it.",
          "3 to 5 highlights and 5 to 8 tags.",
          "Put it in the right category and one or two collections, so other pages link to it.",
          "After publishing, open the book in Google Search Console > URL inspection > Request indexing.",
        ],
      },
    ],
  },
  {
    group: "On-page SEO",
    tips: [
      {
        title: "Titles and descriptions",
        points: [
          "Every page needs its own title and description. Copies of the same text compete with each other.",
          "Write the description like an ad: what it is, why it is good, one call to action (free preview, WhatsApp delivery).",
          "Numbers and specifics win clicks: “120 practice questions”, “for HSC 2026”.",
          "If you leave them empty, the site writes automatic ones from the title and description. Custom is better for important books.",
        ],
      },
      {
        title: "Keywords for Bangladesh",
        points: [
          "People search the same thing three ways: English (“bangla novel pdf”), Bangla (“বাংলা উপন্যাস pdf”) and Banglish (“bangla uponnash pdf”). Cover all three across the title, description and keywords.",
          "Use Admin > Search terms: what visitors type on your site is what they type on Google too.",
          "“Searches that found nothing” are book ideas: add the book, or add the word as a tag on a close match.",
          "Avoid “free download” and piracy words on paid books. They bring the wrong visitors and can hurt trust.",
        ],
      },
      {
        title: "Internal links",
        points: [
          "Collections, categories, “More by this author” and “You may also like” link books together automatically. Keep categories tidy so these links make sense.",
          "Pin important categories and collections in the menu (Categories and Collections pages in admin).",
          "Link to your best books from the About, FAQ and How to order pages where it fits naturally.",
        ],
      },
      {
        title: "Images",
        points: [
          "Cover alt text describes the cover for Google Images and screen readers.",
          "Use real covers, not text-only placeholders: they show in Google Images and in shared links.",
          "Each book automatically gets a share image (title, price, cover) for Facebook and WhatsApp.",
        ],
      },
    ],
  },
  {
    group: "Technical SEO (mostly done for you)",
    tips: [
      {
        title: "What the site already does",
        points: [
          "sitemap.xml and robots.txt are generated automatically and include every published book, category and collection.",
          "Book pages carry Book and Product structured data (price, rating, availability), which can show stars and price in Google.",
          "Every page has a canonical link, and filtered or sorted versions of the shop (?sort=, ?page=) are kept out of Google, so nothing counts as a duplicate.",
          "Old links keep working when you change a book's link name: the site redirects them.",
          "Google Search Console ownership is verified with the file /google7080f1c66b38cc96.html and the tag in Admin > SEO. Do not delete the file.",
        ],
      },
      {
        title: "What you should check",
        points: [
          "Search Console > Pages: fix anything under “Why pages aren't indexed” that should be indexed.",
          "Search Console > Sitemaps: submit /sitemap.xml once; check it says “Success”.",
          "Search Console > Core Web Vitals and Mobile usability: keep both green. Very large images or GIFs in banners slow pages down.",
          "Keep “Hide the whole site from search engines” off in Admin > SEO, except while testing.",
          "Use Admin > SEO > Redirects when you delete a page or book that had visitors.",
        ],
      },
    ],
  },
  {
    group: "Off-page SEO and trust",
    tips: [
      {
        title: "Links and mentions",
        points: [
          "Links from real Bangladeshi blogs, YouTube channels, student groups and book communities count more than many random links.",
          "Share each new book on your Facebook page and in relevant groups with the book's link and the free preview.",
          "A short YouTube video or Reel flipping through the preview pages, with the link in the description, brings both visitors and a link.",
          "Never buy links or fake reviews. Google can ignore or penalise them.",
        ],
      },
      {
        title: "Google Business Profile and brand searches",
        points: [
          "If you can, create a Google Business Profile for eBoi as an online store with your WhatsApp number and website.",
          "Use the same name, logo and link everywhere (Facebook, YouTube, Instagram). Add them in Admin > Menus > social links.",
          "People searching “eBoi pdf” is a strong signal. Ask buyers to search the shop name next time.",
        ],
      },
    ],
  },
  {
    group: "Routine",
    tips: [
      {
        title: "Weekly (15 minutes)",
        points: [
          "Check Admin > Search terms for searches that found nothing.",
          "Request indexing for new books in Search Console.",
          "Post one new or popular book on social media.",
        ],
      },
      {
        title: "Monthly (1 hour)",
        points: [
          "Run the “Monthly Google Search Console review” prompt with your exported data.",
          "Rewrite titles and descriptions for 3 to 5 pages with many impressions but few clicks.",
          "Refresh one old book: better description, highlights, preview.",
          "Check the Dashboard: which books get views but no WhatsApp orders? Improve their page.",
        ],
      },
    ],
  },
];

/** Admin > SEO tips: the handbook and the copy-ready prompts. */
export function SeoTips({ context, books }: { context: SeoContext; books: SeoBook[] }) {
  const [bookId, setBookId] = useState<string>("new");
  const [draft, setDraft] = useState<Draft>({ title: "", author: "", category: "", language: "", price: "", notes: "" });
  const [page, setPage] = useState(context.categories[0] ? `${context.categories[0].name} (${context.categories[0].path})` : "");
  const book = books.find((b) => b.id === bookId) ?? null;
  const pageOptions = useMemo(
    () => [
      ...context.categories.map((c) => ({ label: `Category: ${c.name}`, value: `${c.name} (${c.path})` })),
      ...context.collections.map((c) => ({ label: `Collection: ${c.name}`, value: `${c.name} (${c.path})${c.intro ? `. Current intro: ${c.intro}` : ""}` })),
    ],
    [context],
  );
  const setD = (k: keyof Draft, v: string) => setDraft((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <AdminCard title="How to use the prompts">
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            ["Pick", "Choose a book (or describe a new one) and, for page prompts, a category or collection."],
            ["Copy", "Press “Copy prompt”. Your shop's real details are already inside: categories, prices, what visitors search."],
            ["Paste", "Paste into any AI chat (Claude, ChatGPT, Gemini). Copy its answer into the book form, Admin > SEO or the page settings."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-md bg-muted p-3">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <div>
                <p className="text-base font-semibold">{t}</p>
                <p className="text-sm text-text-2">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </AdminCard>

      <AdminCard title="Prompts for AI" description="Each one starts with your shop's facts, then asks for exactly what the admin fields need.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Book (for the book prompt)" htmlFor="st-book">
            <select id="st-book" className="select" value={bookId} onChange={(e) => setBookId(e.target.value)}>
              <option value="new">A new book (type its details)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} · {b.title}
                  {b.status === "published" ? "" : " (draft)"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category, collection or topic (for page prompts)" htmlFor="st-page">
            <input id="st-page" className="input" list="st-pages" value={page} onChange={(e) => setPage(e.target.value)} placeholder="e.g. IELTS books" />
            <datalist id="st-pages">
              {pageOptions.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </datalist>
          </Field>
          {!book && (
            <div className="grid gap-3 rounded-md border border-dashed border-line-2 p-3 sm:grid-cols-2 md:col-span-2 lg:grid-cols-5">
              <Field label="Title" htmlFor="st-d-title">
                <input id="st-d-title" className="input" value={draft.title} onChange={(e) => setD("title", e.target.value)} />
              </Field>
              <Field label="Author" htmlFor="st-d-author">
                <input id="st-d-author" className="input" value={draft.author} onChange={(e) => setD("author", e.target.value)} />
              </Field>
              <Field label="Category" htmlFor="st-d-cat">
                <input id="st-d-cat" className="input" list="st-cats" value={draft.category} onChange={(e) => setD("category", e.target.value)} />
                <datalist id="st-cats">
                  {context.categories.map((c) => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </Field>
              <Field label="Language" htmlFor="st-d-lang">
                <input id="st-d-lang" className="input" value={draft.language} onChange={(e) => setD("language", e.target.value)} placeholder="Bangla" />
              </Field>
              <Field label={`Price (${context.currency})`} htmlFor="st-d-price">
                <input id="st-d-price" type="number" min={0} className="input" value={draft.price} onChange={(e) => setD("price", e.target.value)} />
              </Field>
              <Field label="What is it about?" htmlFor="st-d-notes" className="sm:col-span-2 lg:col-span-5">
                <textarea id="st-d-notes" rows={2} className="textarea min-h-16" value={draft.notes} onChange={(e) => setD("notes", e.target.value)} placeholder="Who it is for, what is inside, anything special" />
              </Field>
            </div>
          )}
        </div>

        <ul className="mt-5 grid gap-3 lg:grid-cols-2">
          {PROMPTS.map((p) => (
            <li key={p.id} className="min-w-0">
              <PromptCard def={p} text={p.build({ c: context, book, draft, page })} subject={p.needs === "book" ? (book ? book.title : draft.title || "New book") : p.needs === "page" ? page : null} />
            </li>
          ))}
        </ul>
      </AdminCard>

      <AdminCard title="SEO handbook" description="Every kind of SEO for this shop, in plain words. Open a topic to read it.">
        <div className="space-y-5">
          {TIPS.map((g) => (
            <section key={g.group} aria-labelledby={`tips-${g.group}`}>
              <h3 id={`tips-${g.group}`} className="text-base font-semibold">
                {g.group}
              </h3>
              <div className="mt-2 divide-y divide-line rounded-md border border-line">
                {g.tips.map((t, i) => (
                  <details key={t.title} className="group" open={g.group === "Before you publish a book" && i === 0}>
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-base font-medium hover:bg-muted [&::-webkit-details-marker]:hidden">
                      {t.title}
                      <IconChevronDown size={18} className="shrink-0 text-text-3 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="space-y-1.5 px-3 pb-3">
                      {t.points.map((pt) => (
                        <li key={pt} className="flex gap-2 text-sm text-text-2">
                          <IconCheck size={16} className="mt-0.5 shrink-0 text-brand" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

function PromptCard({ def, text, subject }: { def: PromptDef; text: string; subject: string | null }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <div className="flex h-full flex-col rounded-md border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold">{def.title}</p>
          {subject && <p className="mt-0.5 truncate text-sm font-medium text-brand">For: {subject}</p>}
        </div>
        <button
          type="button"
          className={cn("btn btn-sm shrink-0", copied ? "btn-secondary" : "btn-primary")}
          onClick={async () => {
            if (await copyText(text)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          aria-live="polite"
        >
          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
      <p className="mt-1 text-sm text-text-2">{def.when}</p>
      <button type="button" className="mt-2 self-start text-sm font-medium text-brand hover:underline" aria-expanded={show} onClick={() => setShow((s) => !s)}>
        {show ? "Hide prompt" : "Show prompt"}
      </button>
      {show && <Pre>{text}</Pre>}
    </div>
  );
}

function Pre({ children }: { children: ReactNode }) {
  return <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 font-sans text-xs leading-relaxed whitespace-pre-wrap text-text-2">{children}</pre>;
}
