import Link from "next/link";
import { langOf } from "@/lib/bangla";
import { getSettings } from "@/features/settings/queries";
import { pageMetadata } from "@/features/seo/metadata";
import { JsonLd, faqJsonLd } from "@/features/seo/jsonld";
import { PageHeader } from "@/components/page-header";
import { IconPlus } from "@/components/icons";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Questions about buying PDFs",
  description: "Payment, delivery time, previews, refunds and buying several books at once. Short answers.",
  path: "/faq",
});

export default async function FaqPage() {
  const { faq_items } = await getSettings();
  return (
    <>
      {faq_items.length > 0 && <JsonLd data={faqJsonLd(faq_items)} />}
      <PageHeader kicker="FAQ" title="Questions, answered." path="/faq" crumb="FAQ" lead="If yours is not here, ask on WhatsApp. A person reads every message." />
      <section className="container-x pb-20">
        <div className="border-t-[3px] border-ink lg:w-3/4">
          {faq_items.map((f, i) => (
            <details key={i} className="group border-b border-ink" open={i === 0}>
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                <span lang={langOf(f.q)} className="text-title font-semibold">
                  {f.q}
                </span>
                <IconPlus className="shrink-0 transition-transform group-open:rotate-45" />
              </summary>
              <p lang={langOf(f.a)} className="max-w-[60ch] pb-6 text-lead text-ink-2">
                {f.a}
              </p>
            </details>
          ))}
          {faq_items.length === 0 && <p className="py-6 text-ink-2">No questions added yet.</p>}
        </div>
        <p className="mt-10 text-ink-2">
          About refunds: <Link href="/terms" className="link">refunds and terms</Link>.
        </p>
      </section>
    </>
  );
}
