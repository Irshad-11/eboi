import type { Metadata } from "next";
import { getSettings, fillTokens } from "@/features/settings/queries";
import { getPublishedBooks } from "@/features/books/queries";
import { autoCollectionBooks } from "@/features/collections/queries";
import { ProductRow } from "@/features/books/components/product-row";
import { whatsappLink } from "@/features/whatsapp/message";
import { SECTIONS } from "@/config/analytics";
import { HOME } from "@/config/site";
import { JourneySection } from "@/features/home/journey-section";
import { pageMetadata } from "@/features/seo/metadata";
import { InfoLayout, OrderPanel, PageHeader } from "@/components/page-header";
import { RichText } from "@/components/rich-text";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ page: "about", path: "/about", title: "About us" });
}


async function sidePanel() {
  const [s, books] = await Promise.all([getSettings(), getPublishedBooks()]);
  const steps = s.how_to_buy_steps.map((st) => ({ title: fillTokens(st.title, s), body: fillTokens(st.body, s) }));
  return {
    settings: s,
    aside: <OrderPanel whatsappHref={s.whatsapp_number ? whatsappLink(s.whatsapp_number, "Hi eBoi!") : null} payments={s.payment_methods} responseTime={s.response_time} />,
    journey: <JourneySection steps={steps} />,
    popular: (
      <ProductRow
        id="popular-title"
        title="Popular books"
        books={autoCollectionBooks("best-selling", books).slice(0, HOME.rowCount)}
        symbol={s.currency_symbol}
        section={SECTIONS.bestSelling}
        href="/collections/best-selling"
      />
    ),
  };
}

export default async function AboutPage() {
  const { settings, aside, journey, popular } = await sidePanel();
  return (
    <>
      <PageHeader title="About us" path="/about" crumb="About" />
      <InfoLayout aside={aside}>
        <section className="rounded-lg border border-line bg-white p-5 md:p-8">
          <RichText html={settings.about_content} className="text-base" />
        </section>
      </InfoLayout>
      <div className="pt-4">
        {journey}
        {popular}
      </div>
    </>
  );
}
