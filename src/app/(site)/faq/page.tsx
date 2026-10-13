import Link from "next/link";
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
import { JsonLd, faqJsonLd } from "@/features/seo/jsonld";
import { InfoLayout, OrderPanel, PageHeader } from "@/components/page-header";
import { FaqList } from "@/components/faq-list";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ page: "faq", path: "/faq", title: "Frequently asked questions" });
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

export default async function FaqPage() {
  const { settings, aside, journey, popular } = await sidePanel();
  const faq_items = settings.faq_items;
  return (
    <>
      {faq_items.length > 0 && <JsonLd data={faqJsonLd(faq_items)} />}
      <PageHeader title="Frequently asked questions" path="/faq" crumb="FAQ" />
      <InfoLayout aside={aside}>
        {faq_items.length ? (
          <FaqList items={faq_items} openFirst />
        ) : (
          <Link href="/how-to-order" className="btn btn-secondary">
            How to order
          </Link>
        )}
      </InfoLayout>
      <div className="pt-4">
        {journey}
        {popular}
      </div>
    </>
  );
}
