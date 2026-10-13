import { publicEnv } from "@/lib/env";
import { htmlToText } from "@/lib/rich-text";
import { createSessionClient } from "@/lib/supabase/server";
import { getSettings } from "@/features/settings/queries";
import { getSearchTerms } from "@/features/analytics/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { SeoTips, type SeoBook, type SeoContext } from "@/features/admin/components/seo-tips";

export const metadata = { title: "SEO tips" };

/**
 * SEO handbook plus ready prompts. Every prompt carries this shop's real
 * facts (name, address, categories, prices, what people search for), so
 * any AI can give advice that fits eBoi instead of generic tips.
 */
export default async function SeoTipsPage() {
  const supabase = await createSessionClient();
  const [settings, books, cats, cols, terms] = await Promise.all([
    getSettings(),
    supabase
      .from("books")
      .select("id, book_code, title, subtitle, slug, author, category, language, tags, page_count, price, status, description, highlights, seo_title, seo_description, focus_keyword, seo_keywords")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("name, slug").order("sort_order"),
    supabase.from("collections").select("name, slug, editorial_intro").order("sort_order"),
    getSearchTerms(30).catch(() => []),
  ]);

  const list = books.data ?? [];
  const published = list.filter((b) => b.status === "published");
  const prices = published.map((b) => Number(b.price)).filter((p) => p > 0);

  const context: SeoContext = {
    siteName: settings.site_name,
    siteUrl: publicEnv.siteUrl,
    tagline: settings.tagline,
    titleTemplate: settings.title_template,
    metaDescription: settings.default_meta_description,
    keywords: settings.default_keywords,
    currency: settings.currency_symbol,
    payments: settings.payment_methods.map((m) => m.label),
    responseTime: settings.response_time,
    abroad: settings.abroad_enabled,
    bookCount: published.length,
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
    categories: (cats.data ?? []).map((c) => ({ name: c.name, path: `/category/${c.slug}` })),
    collections: (cols.data ?? []).map((c) => ({ name: c.name, path: `/collections/${c.slug}`, intro: c.editorial_intro })),
    languages: [...new Set(list.map((b) => b.language).filter(Boolean))],
    topSearches: terms.slice(0, 15).map((t) => t.term),
    zeroSearches: terms.filter((t) => t.last_result_count === 0).slice(0, 15).map((t) => t.term),
  };

  const seoBooks: SeoBook[] = list.map((b) => ({
    id: b.id,
    code: b.book_code,
    title: b.title,
    subtitle: b.subtitle ?? "",
    slug: b.slug,
    author: b.author,
    category: b.category,
    language: b.language,
    tags: b.tags,
    pages: b.page_count,
    price: Number(b.price),
    status: b.status,
    description: htmlToText(b.description).slice(0, 1500),
    highlights: b.highlights,
    seoTitle: b.seo_title ?? "",
    seoDescription: b.seo_description ?? "",
    focusKeyword: b.focus_keyword ?? "",
    seoKeywords: b.seo_keywords,
  }));

  return (
    <>
      <AdminPageHead title="SEO tips" meta="A checklist for every kind of SEO, plus prompts with this shop's details already filled in" />
      <SeoTips context={context} books={seoBooks} />
    </>
  );
}
