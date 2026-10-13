import { SITE } from "@/config/site";
import { FEATURES, type FeatureFlags, type HomeSection, type SiteSettings } from "./schema";

export const DEFAULT_GOOGLE_VERIFICATION = "hsdg_1mNbuEtI8Q199rubZFV3AF54vBH2k6L7A1Kxk0";

export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { type: "hero", enabled: true },
  { type: "trust", enabled: true },
  { type: "categories", enabled: true },
  { type: "offers", enabled: true },
  { type: "newest", enabled: true },
  { type: "best_selling", enabled: true },
  { type: "latest", enabled: true },
  { type: "collections", enabled: true },
  { type: "collection_tiles", enabled: false },
  { type: "recent", enabled: true },
  { type: "stats", enabled: true },
  { type: "testimonials", enabled: true },
  { type: "journey", enabled: true },
  { type: "faq", enabled: true },
];

export const DEFAULT_FEATURES = Object.fromEntries(Object.entries(FEATURES).map(([k, f]) => [k, f.default])) as FeatureFlags;

/**
 * Used before Supabase is connected, and as a fallback for any value the
 * settings row does not have yet, so the site always renders.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: SITE.name,
  tagline: SITE.defaultTagline,
  currency_symbol: SITE.defaultCurrencySymbol,
  whatsapp_number: "",
  whatsapp_template: "Hi eBoi! I want this PDF:\n\n[Book Title]\nBook ID: [Book ID]\nPrice: [Price]\n\nLink: [Site URL]",
  whatsapp_list_template: "Hi eBoi! I want these PDFs:\n\n[Book List]\n\nTotal: [Total]\nMy list: [Site URL]",
  response_time: "10 minutes",
  delivery_note: "Delivered on WhatsApp",
  announcement: "",
  announcement_link: "",
  announcement_active: false,
  announcement_dismissible: true,
  announcement_bg: "#d42d2d",
  announcement_fg: "#ffffff",
  announcement_image: null,
  hero_interval: 5,
  popup_enabled: false,
  popup_title: "",
  popup_body: "",
  popup_image: null,
  popup_button_label: "",
  popup_link: "",
  popup_show_latest: true,
  popup_delay: 2,
  popup_autoclose: 0,
  popup_frequency: "session",
  popup_version: 0,
  features: DEFAULT_FEATURES,
  trending_searches: [],
  payment_methods: [
    { label: "bKash", number: "", note: "Send Money" },
    { label: "Nagad", number: "", note: "Send Money" },
  ],
  how_to_buy_steps: [
    { title: "Pick a book", body: "Check the preview if you like." },
    { title: "Message us on WhatsApp", body: "Copy the ready message so you never have to type." },
    { title: "We reply within [Response time]", body: "A real person answers your message." },
    { title: "Pay with bKash or Nagad", body: "Send the total by Send Money. We confirm in the chat." },
    { title: "Get your PDF on WhatsApp", body: "We send the PDF with your name as a watermark." },
  ],
  header_links: [],
  footer_columns: [
    {
      title: "Shop",
      links: [
        { label: "All books", url: "/shop" },
        { label: "Best selling", url: "/collections/best-selling" },
        { label: "New arrivals", url: "/collections/latest" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "How to order", url: "/how-to-order" },
        { label: "FAQ", url: "/faq" },
        { label: "Refund policy", url: "/terms" },
      ],
    },
    {
      title: "eBoi",
      links: [
        { label: "About us", url: "/about" },
        { label: "My List", url: "/my-list" },
      ],
    },
  ],
  social_links: [],
  home_sections: DEFAULT_HOME_SECTIONS,
  about_content: "",
  terms_content: "",
  how_to_order_content: "",
  faq_items: [],
  title_template: `%s | ${SITE.name}`,
  default_meta_description:
    "Buy PDF books in Bangladesh. Read a free preview of every book, order on WhatsApp, pay with bKash or Nagad and get your PDF in minutes.",
  default_keywords: ["eboi", "pdf books", "bangla pdf book", "buy pdf book bangladesh"],
  default_og_image_path: null,
  site_noindex: false,
  google_verification: DEFAULT_GOOGLE_VERIFICATION,
  bing_verification: "",
};
