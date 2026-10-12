import "server-only";
import { BUCKETS } from "@/config/storage";
import { SECTIONS, collectionSection, type EventType } from "@/config/analytics";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/database.types";
import { applyDiscount } from "@/features/offers/pricing";
import { newObjectPath } from "../paths";
import { removeFiles } from "../storage.server";
import { DEMO_BOOKS, DEMO_COLLECTIONS, DEMO_OFFERS, DEMO_SEARCHES, type DemoBook } from "./data";
import { renderDemoCover } from "./covers";
import { renderDemoPreview } from "./previews";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];

const DAY = 86400000;

/** Small seeded PRNG so demo analytics look the same on every load. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function hasDemoData(): Promise<boolean> {
  const { count } = await createServiceClient().from("books").select("id", { count: "exact", head: true }).eq("is_demo", true);
  return (count ?? 0) > 0;
}

/**
 * Loads the full demo set. Runs with the service role AFTER the caller has
 * verified the admin (see actions/tools.ts). If any step fails, everything
 * created so far is removed again, files included.
 */
export async function loadDemo(): Promise<{ books: number; sales: number; events: number }> {
  const db = createServiceClient();
  const now = Date.now();
  try {
    // Collections
    const { data: cols, error: colErr } = await db
      .from("collections")
      .insert(DEMO_COLLECTIONS.map(({ key: _k, ...c }) => ({ ...c, is_demo: true, show_on_home: true })))
      .select("id, slug");
    if (colErr) throw colErr;
    const colId = new Map(DEMO_COLLECTIONS.map((c) => [c.key, cols!.find((x) => x.slug === c.slug)!.id]));

    // Offers
    const { data: offers, error: offErr } = await db
      .from("offers")
      .insert(
        DEMO_OFFERS.map((o) => ({
          title: o.title,
          banner_text: o.banner_text,
          discount_type: o.discount_type,
          value: o.value,
          applies_to: o.applies_to,
          start_at: new Date(now - o.startDaysAgo * DAY).toISOString(),
          end_at: new Date(now + o.endInHours * 3600000).toISOString(),
          show_countdown: o.show_countdown,
          is_active: o.is_active,
          is_demo: true,
        })),
      )
      .select("id, title");
    if (offErr) throw offErr;
    const offerId = new Map(DEMO_OFFERS.map((o) => [o.key, offers!.find((x) => x.title === o.title)!.id]));

    // Books with generated files. Covers and previews are made one book at a
    // time to keep memory flat on small serverless instances.
    const bookId = new Map<string, string>();
    for (const b of DEMO_BOOKS) {
      const id = crypto.randomUUID();
      bookId.set(b.key, id);
      const coverPath = newObjectPath(id, "png");
      const cover = await renderDemoCover(b);
      const up1 = await db.storage.from(BUCKETS.covers).upload(coverPath, cover, { contentType: "image/png", cacheControl: "31536000" });
      if (up1.error) throw up1.error;

      let previewPath: string | null = null;
      let previewPages: number | null = null;
      if (!b.noPreview) {
        previewPages = b.key === "ielts" ? 9 : 7;
        previewPath = newObjectPath(id, "pdf");
        const pdf = await renderDemoPreview(b, previewPages);
        const up2 = await db.storage.from(BUCKETS.previews).upload(previewPath, pdf, { contentType: "application/pdf", cacheControl: "31536000" });
        if (up2.error) throw up2.error;
      }

      const { error } = await db.from("books").insert(toRow(b, id, now, coverPath, previewPath, previewPages, b.pinnedOffer ? offerId.get(b.pinnedOffer) : null));
      if (error) throw error;
    }

    // Collection membership, in data order
    const members = DEMO_BOOKS.flatMap((b) => b.collections.map((c) => ({ collection_id: colId.get(c)!, book_id: bookId.get(b.key)! })));
    const positions = new Map<string, number>();
    const { error: memErr } = await db.from("collection_books").insert(
      members.map((m) => {
        const pos = (positions.get(m.collection_id) ?? 0) + 1;
        positions.set(m.collection_id, pos);
        return { ...m, position: pos };
      }),
    );
    if (memErr) throw memErr;

    // Offer targets
    const ob = DEMO_OFFERS.flatMap((o) => o.books.map((k) => ({ offer_id: offerId.get(o.key)!, book_id: bookId.get(k)! })));
    const oc = DEMO_OFFERS.flatMap((o) => o.collections.map((k) => ({ offer_id: offerId.get(o.key)!, collection_id: colId.get(k)! })));
    if (ob.length) {
      const { error } = await db.from("offer_books").insert(ob);
      if (error) throw error;
    }
    if (oc.length) {
      const { error } = await db.from("offer_collections").insert(oc);
      if (error) throw error;
    }

    // Sales: 60 over the last 85 days, popular books more often. The trigger
    // adds each one to total_sells, so the seeded counters are reduced first.
    const rand = rng(20261012);
    const published = DEMO_BOOKS.filter((b) => b.status === "published");
    const weights = published.map((b) => Math.max(1, b.total_sells));
    const pick = () => {
      let r = rand() * weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < published.length; i++) if ((r -= weights[i]!) <= 0) return published[i]!;
      return published[0]!;
    };
    const notes = ["bKash", "Nagad", "bKash, repeat buyer", "bank transfer", "", "", "asked about a printed copy"];
    const sales = Array.from({ length: 60 }, () => {
      const b = pick();
      const discounted = rand() < 0.35 ? applyDiscount(b.price, "percent", 15) : b.price;
      return {
        book_id: bookId.get(b.key)!,
        book_title_snapshot: b.title,
        book_code_snapshot: null as string | null,
        price_snapshot: discounted,
        sold_at: new Date(now - Math.floor(rand() * 85 * DAY)).toISOString(),
        note: notes[Math.floor(rand() * notes.length)] || null,
        is_demo: true,
      };
    });
    const { data: codes } = await db.from("books").select("id, book_code").eq("is_demo", true);
    const codeOf = new Map((codes ?? []).map((c) => [c.id, c.book_code]));
    for (const s of sales) s.book_code_snapshot = codeOf.get(s.book_id) ?? null;
    const { error: saleErr } = await db.from("sales_log").insert(sales);
    if (saleErr) throw saleErr;

    // Events: 90 days of plausible traffic, written in batches.
    const events = makeEvents(rand, now, bookId);
    for (let i = 0; i < events.length; i += 1000) {
      const { error } = await db.from("events").insert(events.slice(i, i + 1000));
      if (error) throw error;
    }

    return { books: DEMO_BOOKS.length, sales: sales.length, events: events.length };
  } catch (err) {
    await deleteDemo().catch(() => undefined);
    const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "unknown error";
    throw new Error(`Demo load failed and was rolled back: ${msg}`);
  }
}

function toRow(b: DemoBook, id: string, now: number, cover: string, preview: string | null, previewPages: number | null, offerId: string | null | undefined) {
  // Seeded sells are lowered by the expected demo sales so the trigger lands near the target.
  const seededSells = Math.max(0, b.total_sells - Math.round((60 * b.total_sells) / DEMO_BOOKS.reduce((s, x) => s + Math.max(1, x.total_sells), 0)));
  return {
    id,
    title: b.title,
    subtitle: b.subtitle,
    slug: b.slug,
    author: b.author,
    category: b.category,
    tags: b.tags,
    language: b.language,
    page_count: b.page_count,
    format: "PDF",
    file_size: b.file_size,
    description: b.description,
    highlights: b.highlights,
    table_of_contents: b.toc,
    price: b.price,
    old_price: b.old_price ?? null,
    offer_id: offerId ?? null,
    rating: b.rating,
    rating_count: b.rating_count,
    total_sells: b.status === "published" ? seededSells : 0,
    views: b.views,
    release_date: new Date(now - b.daysAgo * DAY).toISOString().slice(0, 10),
    is_featured: b.is_featured ?? false,
    status: b.status,
    badge: b.badge,
    cover_path: cover,
    preview_path: preview,
    preview_page_count: previewPages,
    internal_file_note: `D:/eboi/books/${b.slug}-FULL.pdf (demo)`,
    is_demo: true,
  };
}

function makeEvents(rand: () => number, now: number, bookIds: Map<string, string>): EventInsert[] {
  const out: EventInsert[] = [];
  const published = DEMO_BOOKS.filter((b) => b.status === "published");
  const refs = ["google.com", "google.com", "google.com", "facebook.com", "m.facebook.com", "l.instagram.com", null, null, null];
  const homeSections = [SECTIONS.newest, SECTIONS.bestSelling, SECTIONS.latest, SECTIONS.offers, collectionSection("start-a-side-business"), collectionSection("weekend-reads")];
  let seq = 0;
  const id = () => (++seq).toString(36).padStart(8, "0") + Math.floor(rand() * 1e9).toString(36);

  for (let d = 89; d >= 0; d--) {
    // Gentle growth plus a weekend bump.
    const dayStart = now - d * DAY;
    const weekday = new Date(dayStart).getUTCDay();
    const visitors = Math.round((14 + (89 - d) * 0.35) * (weekday === 5 || weekday === 6 ? 1.35 : 1) * (0.8 + rand() * 0.4));
    for (let v = 0; v < visitors; v++) {
      const anon = `demo${id()}`;
      const session = `demo${id()}`;
      const at = () => new Date(dayStart - Math.floor(rand() * DAY * 0.9)).toISOString();
      const device = rand() < 0.78 ? "mobile" : rand() < 0.8 ? "desktop" : "tablet";
      const referrer = refs[Math.floor(rand() * refs.length)]!;
      // Same rule as the live tracker: one row per (session, dedupe key).
      const seen = new Set<string>();
      const push = (type: EventType, extra: Partial<EventInsert> = {}) => {
        const key = extra.dedupe_key ?? [type, extra.book_id, extra.section, extra.term, extra.page].join("|");
        if (seen.has(key)) return;
        seen.add(key);
        out.push({
          type,
          anon_id: anon,
          session_id: session,
          device,
          referrer,
          path: "/",
          created_at: at(),
          is_demo: true,
          ...extra,
          dedupe_key: key,
        });
      };

      push("page_view", { path: "/", dedupe_key: "page_view|/" });
      if (rand() < 0.3) push("page_view", { path: "/shop", dedupe_key: "page_view|/shop" });
      if (rand() < 0.12) {
        const s = DEMO_SEARCHES[Math.floor(rand() * DEMO_SEARCHES.length)]!;
        push("search", { term: s.term, result_count: s.hits ? 1 + Math.floor(rand() * 3) : 0, section: SECTIONS.shopSearch, path: "/shop" });
      }
      if (rand() < 0.06) push("filter", { term: "category:Business", section: SECTIONS.shopFilters, path: "/shop" });

      const looks = rand() < 0.7 ? 1 + Math.floor(rand() * 2) : 0;
      for (let l = 0; l < looks; l++) {
        const b = published[Math.floor(Math.pow(rand(), 1.6) * published.length)]!;
        const bid = bookIds.get(b.key)!;
        const path = `/books/${b.slug}`;
        push("book_click", { book_id: bid, section: homeSections[Math.floor(rand() * homeSections.length)]! });
        push("page_view", { path, dedupe_key: `page_view|${path}` });
        push("book_view", { book_id: bid, path });
        if (rand() < 0.42) {
          push("preview_open", { book_id: bid, section: SECTIONS.detailPreview, path });
          const maxPage = 1 + Math.floor(rand() * 7);
          for (let p = 1; p <= maxPage; p++) push("preview_page", { book_id: bid, section: SECTIONS.detailPreview, page: p, path });
        }
        if (rand() < 0.16) {
          const section = rand() < 0.6 ? SECTIONS.detailBuyBox : rand() < 0.5 ? SECTIONS.detailSticky : SECTIONS.detailPreview;
          push("whatsapp_click", { book_id: bid, section, path });
          if (rand() < 0.55) push("copy_click", { book_id: bid, section, path });
          if (rand() < 0.7) push("whatsapp_open", { book_id: bid, section, path });
        }
        if (rand() < 0.08) push("list_add", { book_id: bid, section: SECTIONS.detailBuyBox, path });
      }
    }
  }
  return out;
}

/**
 * Removes every demo row AND every file in the demo books' storage folders.
 * Events and sales are deleted explicitly (their book_id would otherwise just
 * be set to null and the rows would linger).
 */
export async function deleteDemo(): Promise<{ books: number; files: number }> {
  const db = createServiceClient();
  const { data: books } = await db.from("books").select("id, cover_path, preview_path").eq("is_demo", true);
  const ids = (books ?? []).map((b) => b.id);

  // Everything in each demo book's folder, not just the paths on the row.
  let files = 0;
  for (const bucket of [BUCKETS.covers, BUCKETS.previews] as const) {
    const paths: string[] = [];
    for (const id of ids) {
      const { data } = await db.storage.from(bucket).list(id, { limit: 100 });
      for (const f of data ?? []) if (f.id) paths.push(`${id}/${f.name}`);
    }
    files += paths.length;
    await removeFiles(bucket, paths);
  }

  const steps = [
    await db.from("events").delete().eq("is_demo", true),
    await db.from("sales_log").delete().eq("is_demo", true),
    await db.from("offers").delete().eq("is_demo", true),
    await db.from("collections").delete().eq("is_demo", true),
    await db.from("books").delete().eq("is_demo", true),
  ];
  const err = steps.find((s) => s.error)?.error;
  if (err) throw new Error(err.message);
  return { books: ids.length, files };
}
