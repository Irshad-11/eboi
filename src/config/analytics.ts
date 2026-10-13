/**
 * Analytics vocabulary. The database CHECK constraint on events.type uses the
 * same list, so adding a type means editing supabase/schema.sql too.
 */
export const EVENT_TYPES = [
  "page_view",
  "book_view",
  "section_view",
  "book_click",
  "search",
  "filter",
  "preview_open",
  "preview_page",
  /** Tapped a "Get it on WhatsApp" button (opens the message sheet). */
  "whatsapp_click",
  /** Pressed "Open WhatsApp" inside the sheet: the actual hand-off. */
  "whatsapp_open",
  "copy_click",
  "list_add",
  /** Click on a home banner slide. */
  "banner_click",
  /** Share button on a book page. */
  "share_click",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/**
 * Named page sections. Section names are free text in the database so a new
 * collection (section `collection:<slug>`) needs no migration, but fixed ones
 * are listed here to keep spelling consistent.
 */
export const SECTIONS = {
  hero: "home_hero",
  categories: "home_categories",
  collectionTiles: "home_collection_tiles",
  recent: "home_recent",
  journey: "home_journey",
  faq: "home_faq",
  categoryGrid: "category_grid",
  detailGallery: "detail_gallery",
  detailTabs: "detail_tabs",
  detailReviews: "detail_reviews",
  searchSuggest: "search_suggest",
  frontPage: "home_front_page",
  newest: "home_newest",
  offers: "home_offers",
  bestSelling: "home_best_selling",
  latest: "home_latest",
  howItWorks: "home_how_it_works",
  about: "home_about",
  continueBrowsing: "home_continue",
  shopResults: "shop_results",
  shopSearch: "shop_search",
  shopFilters: "shop_filters",
  collectionGrid: "collection_grid",
  detailBuyBox: "detail_buy_box",
  detailSticky: "detail_sticky_cta",
  detailHighlights: "detail_highlights",
  detailDescription: "detail_description",
  detailToc: "detail_toc",
  detailPreview: "detail_preview",
  detailRelated: "detail_related",
  myList: "my_list",
  header: "header",
  notFound: "not_found",
} as const;

export const collectionSection = (slug: string) => `collection:${slug}`;

/** Admin date ranges in days. */
export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

/** localStorage / cookie / sessionStorage keys. */
export const STORAGE_KEYS = {
  anonId: "eboi_aid",
  sessionId: "eboi_sid",
  dedupe: "eboi_seen",
  myList: "eboi_list",
  recent: "eboi_recent",
  splashSeen: "eboi_splash",
} as const;

/** Human labels for section keys in the admin. Unknown keys fall back to a tidied key. */
const SECTION_LABELS: Record<string, string> = {
  [SECTIONS.hero]: "Home: banner carousel",
  [SECTIONS.categories]: "Home: categories",
  [SECTIONS.collectionTiles]: "Home: collection tiles",
  [SECTIONS.recent]: "Home: recently viewed",
  [SECTIONS.journey]: "Home: how to order",
  [SECTIONS.faq]: "Home: FAQ",
  [SECTIONS.categoryGrid]: "Category page",
  [SECTIONS.detailGallery]: "Book page: gallery",
  [SECTIONS.detailTabs]: "Book page: tabs",
  [SECTIONS.detailReviews]: "Book page: reviews",
  [SECTIONS.frontPage]: "Home: front page",
  [SECTIONS.newest]: "Home: newest book",
  [SECTIONS.offers]: "Home: offers",
  [SECTIONS.bestSelling]: "Home: best selling",
  [SECTIONS.latest]: "Home: new arrivals",
  [SECTIONS.howItWorks]: "Home: how it works",
  [SECTIONS.about]: "Home: about",
  [SECTIONS.continueBrowsing]: "Continue browsing",
  [SECTIONS.shopResults]: "Shop: results",
  [SECTIONS.shopSearch]: "Shop: search",
  [SECTIONS.shopFilters]: "Shop: filters",
  [SECTIONS.detailBuyBox]: "Book page: buy box",
  [SECTIONS.detailSticky]: "Book page: sticky bar (mobile)",
  [SECTIONS.detailHighlights]: "Book page: what you get",
  [SECTIONS.detailDescription]: "Book page: description",
  [SECTIONS.detailToc]: "Book page: contents",
  [SECTIONS.detailPreview]: "Book page: preview",
  [SECTIONS.detailRelated]: "Book page: related books",
  [SECTIONS.myList]: "My List",
  [SECTIONS.notFound]: "404 page",
};

export function sectionLabel(key: string): string {
  if (SECTION_LABELS[key]) return SECTION_LABELS[key];
  if (key.startsWith("collection:")) return `Home: collection “${key.slice(11)}”`;
  if (key.startsWith(`${SECTIONS.collectionGrid}:`)) return `Collection page “${key.split(":")[1]}”`;
  return key.replace(/_/g, " ");
}
