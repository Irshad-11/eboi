# eBoi

**PDF only. Premium feel.**

A small, fast PDF bookshop. Visitors read the first pages of a book in the
browser, then buy it with one pre-written WhatsApp message. The full PDF never
touches the website: it stays on your computer and you send it in the chat.

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres,
Auth, private Storage) · pdf.js · Vercel.

---

## Contents

1. [Setup, step by step](#1-setup-step-by-step)
2. [Deploy to Vercel](#2-deploy-to-vercel)
3. [Google Search Console and the "eboi" search](#3-google-search-console-and-the-eboi-search)
4. [Daily use](#4-daily-use)
5. [How it works](#5-how-it-works)
6. [Project structure](#6-project-structure)
7. [Design system](#7-design-system)
8. [Adding payments later](#8-adding-payments-later)
9. [Assumptions and decisions](#9-assumptions-and-decisions)

---

## 1. Setup, step by step

You need Node.js 20.9 or newer and a free Supabase account.

### 1.1 Create the Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**.
2. Region: **Southeast Asia (Singapore)**. It is the closest region to
   Bangladesh, and `vercel.json` puts the website in Singapore too.
3. Save the database password somewhere safe (you will not need it for this
   project, but Supabase asks for it).

### 1.2 Run the SQL

1. In the project: **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this folder, copy all of it, paste, **Run**.

This creates every table, the Row Level Security policies, the two **private**
storage buckets (`covers`, `previews`) with their size and type limits, the
storage policies, the triggers (Book IDs, slug history, sales counters) and the
analytics functions. It is safe to run again after updates.

### 1.3 Create the admin (and close the door behind you)

1. **Authentication → Sign In / Providers → Email**: turn **off**
   "Allow new users to sign up". There is no public sign-up anywhere.
2. **Authentication → Users → Add user → Create new user**: your email and a
   strong password. Tick **Auto Confirm User**.
3. Back in **SQL Editor**, run this with your email:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

Only users listed in `admin_users` are admins. The check happens three times:
in the proxy (`src/proxy.ts`), in every admin page and server action
(`src/features/admin/auth.ts`), and in the database through RLS.

### 1.4 Fill in `.env`

```bash
cp .env.example .env
```

From **Project Settings → API** (or **API Keys**):

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` key, or the new **publishable** key | Safe in the browser. RLS protects the data. |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key, or the new **secret** key | **Server only.** Never add `NEXT_PUBLIC_` to it. |
| `NEXT_PUBLIC_SITE_URL` | your site | `http://localhost:3000` locally, `https://eboi.vercel.app` (or your domain) in production. No trailing slash. |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Search Console | Optional, see section 3. |

### 1.5 Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Sign in at <http://localhost:3000/admin>.

### 1.6 Load the demo data (optional, recommended once)

**Admin → Demo data and storage → Load demo data.** In about 20 seconds you
get 10 invented books (2 drafts, 1 Bangla title, 1 without a preview) with
typeset covers and preview PDFs, three collections (one in each visual mood),
five offers (live, scheduled and switched off), 60 sales and 90 days of
analytics. Everything is marked DEMO.

**Delete all demo data** removes every demo row *and* every demo file from
storage. Your own books are never touched.

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

---

## 2. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. <https://vercel.com/new> → import the repository. Framework: Next.js
   (detected).
3. **Environment Variables**: add the five variables from `.env`, with
   `NEXT_PUBLIC_SITE_URL=https://eboi.vercel.app` (or your own domain).
4. **Deploy.**
5. In Supabase, **Authentication → URL Configuration**: set **Site URL** to the
   same address.

If the project name `eboi` is taken on Vercel, you will get a different
`*.vercel.app` address: put that exact address in `NEXT_PUBLIC_SITE_URL` and
redeploy. Every canonical URL, the sitemap, OG images and the links inside
WhatsApp messages come from this one variable.

`vercel.json` is deliberately small: it pins the region to Singapore and adds
a few permanent redirects for links people are likely to type by hand
(`/book/x` → `/books/x`, `/wishlist` → `/my-list`, and so on).

---

## 3. Google Search Console and the "eboi" search

What is already done in code:

- Every page has a title, description, canonical URL, Open Graph and Twitter
  tags (`src/features/seo/metadata.ts`). The home title starts with "eBoi".
- **Organization** and **WebSite** structured data on the home page, with
  `alternateName` covering `eboi`, `E+BOI`, `eBoi PDF` and a **SearchAction**
  (Google can show a search box for the site).
- **Book + Product** data with price and offer on every book page,
  **BreadcrumbList** on books, collections and text pages, **FAQPage** on the
  FAQ, **ItemList** on collections.
- `sitemap.xml` lists every published book (with its cover image) and
  collection, and updates itself. `robots.txt` points to it and keeps
  `/admin`, `/api` and `/my-list` out of search.
- Per-book share images (`/books/<slug>/opengraph-image`) show the real cover,
  title and price: that is what WhatsApp and Facebook display when someone
  shares a link.

What you do once:

1. Open <https://search.google.com/search-console> → **Add property** →
   **URL prefix** → your exact site URL.
2. Choose **HTML tag**. Copy only the `content="..."` value.
3. Put it in Vercel as `NEXT_PUBLIC_GSC_VERIFICATION`, redeploy, then press
   **Verify**. (With your own domain, the DNS method works too and needs no
   variable.)
4. **Sitemaps** → enter `sitemap.xml` → **Submit**.
5. **URL Inspection** → paste the home page URL → **Request indexing**. Do the
   same for your two or three most important books.

To give the brand search "eboi" the best chance: use your own domain if you
can (e.g. `eboi.com.bd`), link to the site from every social profile you own
(add them in **Admin → Settings → Social links**, which also feeds the
Organization data), and keep the site name "eBoi" consistent everywhere you
post. A brand-new site usually needs a few weeks before it ranks for its own
name; nobody can guarantee a position.

**Links never break.** Book and collection URLs are slugs. When you change a
slug, the old one is stored in `book_slug_history` (or
`collection_slug_history`) by a database trigger and the old URL redirects
permanently to the new one. A retired slug can never be given to a different
book, so an old WhatsApp link can never open the wrong book.

---

## 4. Daily use

### Add a book

**Admin → Books → New book.** Fill in the form, attach:

- **Cover**: JPG or PNG, 2:3, at least 600px wide, at most 2 MB.
- **Preview**: a PDF with the first 5 to 10 pages (max 12 pages, 6 MB). Export
  it from your full PDF; never upload the full book.

Leave it as **Draft** to check it (drafts are visible to you only), then
switch to **Published**. The private file note is a reminder of where the
full PDF lives on your computer; visitors can never see it.

Or use **Import / export** with a JSON file plus the two files. The format is
documented in [`docs/BOOK_JSON.md`](docs/BOOK_JSON.md), with a
[sample](docs/sample-book.json) and a [JSON Schema](docs/book-import.schema.json).

### When a WhatsApp order comes in

The buyer's message contains the Book ID (`EB-0004`), the price they saw
(with the offer noted) and a link. Reply with payment details, send the PDF,
then log it in **Admin → Sales log** (pick the book; the price fills itself).
Logging a sale adds one to the book's public "sold" counter and to revenue.

### Offers

**Admin → Offers.** Percent or fixed taka, for every book, chosen books or
whole collections, with start and end times (Dhaka time) and an optional
countdown. The final price is always computed on the server. If several
offers touch one book, the lowest price wins; offers never stack. The home
page shows up to four live offers.

### Pages and settings

**Admin → Pages**: About, How to buy, FAQ, Refunds and terms.
**Admin → Settings**: WhatsApp number, both message templates (with a live
preview), currency symbol, announcement bar, delivery note, social links.

Template placeholders: `[Book Title]`, `[Book ID]`, `[Price]`, `[Site URL]`;
the My List template uses `[Book List]`, `[Total]`, `[Site URL]`.

### Storage hygiene

Saving a new cover or preview deletes the old file. Deleting a book deletes
its files. A failed save deletes what it just uploaded. As a final safety net,
**Admin → Demo data and storage → Find and delete orphan files** removes any
file no book points to (files newer than one hour are skipped).

---

## 5. How it works

### Pages

| Route | What |
|---|---|
| `/` | Front page: what eBoi is, newest book, live offers, best selling chart, latest, collections, continue browsing, how it works, about |
| `/shop` | Search (title, author, tag, Book ID), filters (category, language, price), sort. Works without JavaScript. |
| `/collections/[slug]` | Custom collections plus `best-selling`, `latest`, `most-viewed` |
| `/books/[slug]` | Book page: cover, colophon, price and offer, preview reader, WhatsApp, My List, related, sticky mobile buy bar |
| `/about`, `/how-to-buy`, `/faq`, `/terms`, `/my-list`, 404 | Text pages from Admin → Pages; My List (shareable as `?books=EB-0001,EB-0004`) |
| `/admin/*` | The admin panel |

### The WhatsApp purchase flow

`Get it on WhatsApp` opens a bottom sheet (a centred dialog from 768px) with
the message already written from your template. **Copy message** copies it;
**Open WhatsApp** opens `wa.me/<number>?text=...` with it pre-filled. My List
sends several books in one message with one total and a list link you can
open to see exactly what they picked. Taps, copies and "opened WhatsApp" are
all tracked.

### Preview reader and file security

- Both buckets are **private**. There are no public file URLs anywhere.
- Covers are streamed by `/api/cover/[id]` (published books only; drafts only
  for the admin) and cached for a year under a versioned URL that changes when
  the file changes. Book share images use the same files.
- Previews are opened through `/api/preview/[id]`, which returns a signed URL
  that expires after 90 seconds. pdf.js (lazy-loaded, legacy build for older
  Android phones) downloads the small file once and draws each page to a
  canvas as you scroll.
- Right-click, dragging, text selection, Ctrl/Cmd+S and Ctrl/Cmd+P are
  discouraged and printing hides the pages. **This is friction, not
  protection**: anything visible on a screen can be captured. The real
  protection is that only the first pages are ever uploaded.

### Personalisation without accounts

A random anonymous ID is created in the browser (localStorage plus a
first-party cookie). It powers My List, recently viewed and "continue where
you left off". No IP address is read or stored anywhere.

### Analytics

Two systems, both on:

- **Vercel Analytics** (`@vercel/analytics`): traffic overview in the Vercel
  dashboard. Enable it under the project's **Analytics** tab.
- **Your own analytics in Supabase**, shown in **Admin → Dashboard**:
  - Events are sent with `navigator.sendBeacon` to `/api/track`, validated
    with zod, filtered for bots (client and server side) and deduplicated per
    session (in the browser and by a unique index in the database).
  - Tracked: page views, book views, section views (front page, newest book,
    offers, every collection, search, filters, each book-page section),
    which section a book click came from, preview opens and the deepest page
    reached, WhatsApp taps, message copies, WhatsApp opens, My List adds,
    searches with their result count.
  - Aggregation runs in SQL functions (`analytics_summary`, `analytics_daily`,
    `analytics_funnel`, `analytics_breakdown`, `analytics_top_books`,
    `analytics_search_terms`), callable only by the admin.
  - Dashboard: 7/30/90 days with comparison to the previous period, daily
    trends, a view → preview → WhatsApp → sale funnel, referrers, devices,
    sections that drive clicks, top books. Each book has its own page with the
    same breakdown, next to its public display numbers. **Search terms** lists
    what people looked for, with the searches that found nothing first.

Public counters (rating, sold, views) are **display values** you can edit.
Logged sales and real book views add to them automatically. The admin
analytics always show the real tracked numbers separately.

---

## 6. Project structure

```
supabase/schema.sql          Tables, RLS, buckets, storage policies, triggers, analytics functions
src/
  app/                       Routes only: thin pages that compose features
    (site)/                  Public pages (shared header/footer layout)
    admin/(auth)/login       Sign-in
    admin/(panel)/           Admin pages (server-side admin check in layout)
    api/                     track, cover, preview, books/lookup, admin/export
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx icon.svg …
  config/                    Constants in one place: site, limits, analytics names, buckets
  lib/                       Supabase clients, env, formatting, slugs, dates
  features/
    books/ collections/ offers/ settings/   Queries, schemas, pricing, components
    home/ shop/ book-detail/ preview/ whatsapp/ my-list/
    analytics/               Client tracker, SQL wrappers, charts
    seo/                     Metadata, JSON-LD, OG images
    admin/                   Auth, server actions, forms, uploads, demo data
    layout/                  Header, footer, splash, providers
  components/                Brand-level pieces: wordmark, icons, sheet, section heads
  assets/fonts/              Self-hosted fonts (OFL), see LICENSE.md there
docs/                        Book JSON format, sample, JSON Schema
```

Database types live in `src/lib/supabase/database.types.ts`, hand-written to
match the SQL so the project compiles before Supabase exists. Regenerate them
any time with:

```bash
npx supabase gen types typescript --project-id <your-ref> > src/lib/supabase/database.types.ts
```

---

## 7. Design system

One aesthetic: an editorial print shop. All tokens live in
`src/app/globals.css` and Tailwind's default palette, radii, shadows and type
sizes are switched off, so nothing off-brand can slip in through a class name.

- **Colour**: paper `#f4f0e6` (base), ink `#14201a` (text), a scale of deep
  greens for structure and actions, and ochre `#b8862b` reserved for offers
  and badges. No pure white or black.
- **Type**: Newsreader (one variable serif with an optical-size axis: sharp
  display cut at headline sizes, calm text cut at reading sizes) and IBM Plex
  Mono for Book IDs, prices and labels. Bangla text falls through to Hind
  Siliguri automatically (Bengali subset only, loaded only on pages that
  contain Bangla). All self-hosted through `next/font/local`.
- **Scale**: very large (`text-mega`, `text-display`) against very small
  (`label`, `micro`); little in between.
- **Shape**: square by default; 2px radius for inputs, pills only for badges,
  16px only on the top of mobile bottom sheets.
- **Shadow**: hard, offset, no blur, like stacked paper.
- **Covers**: one treatment everywhere: 2:3, flat, hard shadow, printed spine.
  Hovering a book lifts it off the shelf.
- **Motion** only where it means something: book lift, button press, the
  "Copied" stamp, sheets sliding up, and the first-visit wordmark splash
  (under 1.5s, skippable, never for reduced-motion users, never blocks the
  page underneath).
- **Wordmark**: an italic "e" (electronic) against an upright "Boi" (Bangla
  for book), with a square full stop on the i and a press rule underneath,
  drawn as SVG paths in `src/components/wordmark.tsx`.

---

## 8. Adding payments later

The code is arranged so bKash (or any gateway) slots in without rework:

- **One price source**: `priceBook()` in `src/features/offers/pricing.ts`
  computes the final price on the server. A payment session would charge
  exactly that number.
- **One checkout entry point**: every buy button goes through
  `src/features/whatsapp/buy-button.tsx` and `whatsapp-sheet.tsx`. A "Pay with
  bKash" option becomes a second button in that sheet.
- **Records already exist**: `sales_log` with snapshots. Add an `orders` table
  (status, gateway reference, amount), write a `sales_log` row when a payment
  webhook confirms, and the dashboard, funnel and "sold" counters keep
  working unchanged.
- **Delivery stays manual or becomes a signed link**: full PDFs could later
  go into a third private bucket and be delivered as short-lived signed URLs,
  the same mechanism the previews already use.

---

## 9. Assumptions and decisions

Where the brief left room, these are the choices made:

1. **Next.js 16** (current stable) is used, so the request middleware file is
   `src/proxy.ts` (Next 16's new name for middleware).
2. **Fonts are self-hosted with `next/font/local`** instead of
   `next/font/google`: builds never depend on reaching Google, and the result
   in the browser is the same (preload, swap, size-adjusted fallbacks).
   Hind Siliguri is loaded as its Bengali subset only.
3. **Two English families**: Newsreader (serif, display and text through its
   optical-size axis) and IBM Plex Mono (IDs, prices, labels). No banned font
   is used anywhere.
4. **Slug redirects use HTTP 308**, Next.js's permanent redirect. Google
   treats 308 exactly like 301. It is returned from the page itself, so no
   database lookup is added to every request.
5. **Charts are a small in-house SVG module** (`src/features/analytics/components`)
   rather than an npm chart library: zero dependencies, server-rendered where
   possible, styled with the brand tokens, hover tooltips plus a screen-reader
   table. Each chart shows one series (small multiples), so no chart depends
   on telling colours apart.
6. **Prices are rounded to whole taka** after a discount.
7. **Offers never stack**; the single offer giving the lowest price wins. A
   book can also pin one offer directly (`offer_id`, the "offer reference").
8. **Display counters move with reality**: a logged sale adds 1 to "sold", a
   real (non-bot, once per session) book view adds 1 to "views". You can still
   edit them.
9. **Collections have a `mood`** (paper, forest, ink) so each one gets its own
   layout on the home page, as the brief asked for different moods.
10. **Extra fields added**: `preview_page_count` (counted on upload, shown as
    "7-page preview"), `book_code_snapshot` on sales, `delivery_note` and
    `announcement_active` in settings, a `whatsapp_open` event type (pressing
    "Open WhatsApp", as distinct from tapping the first button).
11. **Uploads go from the admin's browser straight to private storage**, then
    the server re-verifies the actual bytes. This avoids Vercel's ~4.5 MB
    request limit for server functions.
12. **Limits**: cover JPG/PNG, ≥600px wide, ≤2 MB; preview ≤12 pages and
    ≤6 MB. Change them in `src/config/limits.ts` **and** in the bucket
    settings in `schema.sql`.
13. **Covers are JPG or PNG only** (no WebP upload), because the share-image
    renderer cannot read WebP. Visitors still receive AVIF/WebP: next/image
    converts on the fly.
14. **Public pages are cached for 5 minutes** and purged immediately when you
    save anything in the admin. An offer that starts or ends on its own
    timer (with nobody saving anything) shows up within about 5 to 10
    minutes, as the page and its cached database reads both refresh. Changes
    made directly in the Supabase dashboard follow the same timing.
15. **The shop filters in memory** over the published catalogue, so search,
    filters and sorting use final offer prices. Fine for hundreds of books;
    move it into a SQL view past roughly 2,000.
16. **Times are Dhaka time** (UTC+6) in the admin and in daily charts.
17. **My List lives in the visitor's browser** (no server copy), up to 30
    books. The list link in the WhatsApp message reopens the same selection.
18. **Demo covers are drawn with `next/og`** (typography only) and demo
    previews with pdf-lib using standard PDF fonts; the Bangla demo book's
    preview therefore uses English placeholder text.
19. **Ratings in structured data**: only emitted when `rating_count > 0`. Use
    real ratings in production; Google penalises invented review markup.
20. **Copy**: written in a direct voice; no em dashes, no "seamless",
    "effortless" or "curated just for you", in the UI or in this file.

---

Fonts: SIL Open Font License, see `src/assets/fonts/LICENSE.md`.
