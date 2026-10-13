import Link from "next/link";
import type { Metadata } from "next";
import { getSettings, fillTokens } from "@/features/settings/queries";
import { whatsappLink, formatWhatsappNumber } from "@/features/whatsapp/message";
import { pageMetadata } from "@/features/seo/metadata";
import { PageHeader } from "@/components/page-header";
import { RichText } from "@/components/rich-text";
import { CopyButton } from "@/components/copy-button";
import { OrderSteps } from "@/features/journey/order-steps";
import { IconWhatsApp, IconWallet } from "@/components/icons";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    page: "how-to-order",
    path: "/how-to-order",
    title: "How to order",
    description: "Pick a book, message us on WhatsApp, pay with bKash or Nagad and get your PDF in the same chat.",
  });
}

export default async function HowToOrderPage() {
  const s = await getSettings();
  const steps = s.how_to_buy_steps.map((st) => ({ title: fillTokens(st.title, s), body: fillTokens(st.body, s) }));
  const methods = s.payment_methods.filter((m) => m.number);
  const number = formatWhatsappNumber(s.whatsapp_number);
  return (
    <>
      <PageHeader title="How to order" path="/how-to-order" crumb="How to order" />
      <div className="container-x mt-4 space-y-4">
        <section className="rounded-lg border border-line bg-white p-5 md:p-8" aria-label="Steps">
          <OrderSteps steps={steps} />
        </section>

        {methods.length > 0 && (
          <section className="rounded-lg border border-line bg-white p-5 md:p-8" aria-labelledby="pay-title">
            <h2 id="pay-title" className="text-lg font-semibold">
              Payment numbers
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {methods.map((m) => (
                <li key={m.label} className="flex items-center gap-3 rounded-md border border-line p-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <IconWallet size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold">
                      {m.label}
                      {m.note && <span className="ml-2 text-sm font-normal text-text-3">{m.note}</span>}
                    </p>
                    <p className="text-md tnum">{m.number}</p>
                  </div>
                  <CopyButton value={m.number} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {s.how_to_order_content && (
          <section className="rounded-lg border border-line bg-white p-5 md:p-8">
            <RichText html={s.how_to_order_content} className="max-w-3xl text-base" />
          </section>
        )}

        <section className="flex flex-col items-start gap-3 rounded-lg border border-line bg-white p-5 sm:flex-row sm:items-center md:p-8">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Questions before you order?</h2>
            {number && <p className="mt-0.5 text-base text-text-3">WhatsApp {number}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {s.whatsapp_number && (
              <a href={whatsappLink(s.whatsapp_number, "Hi eBoi!")} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <IconWhatsApp size={18} />
                Message us
              </a>
            )}
            <Link href="/shop" className="btn btn-secondary">
              Browse books
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
