import { SITE } from "@/config/site";
import type { SiteSettings } from "./schema";

/**
 * Used before Supabase is connected (and as a fallback if the settings row is
 * unreadable) so the site still renders during first setup.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: SITE.name,
  tagline: SITE.defaultTagline,
  whatsapp_number: "",
  whatsapp_template:
    "Hi eBoi! I want this PDF:\n\n[Book Title]\nBook ID: [Book ID]\nPrice: [Price]\n\nLink: [Site URL]",
  whatsapp_list_template: "Hi eBoi! I want these PDFs:\n\n[Book List]\n\nTotal: [Total]\nMy list: [Site URL]",
  currency_symbol: SITE.defaultCurrencySymbol,
  announcement: "",
  announcement_active: false,
  delivery_note:
    "The PDF arrives in the same WhatsApp chat after payment. Most orders are sent within 30 minutes, 10am to 11pm.",
  social_links: [],
  about_content: "",
  terms_content: "",
  faq_items: [],
  how_to_buy_steps: [
    { title: "Pick a book", body: "Browse the shop or a collection." },
    { title: "Read the preview", body: "Open the free preview on the book page." },
    { title: "Send one message", body: "Tap the WhatsApp button. The message is already written." },
    { title: "Pay and receive", body: "After payment the PDF arrives in the same chat." },
  ],
};
