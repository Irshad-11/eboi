import { getSettings } from "@/features/settings/queries";
import { pageMetadata } from "@/features/seo/metadata";
import { PageHeader } from "@/components/page-header";
import { RichText } from "@/components/rich-text";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Refunds and terms",
  description: "What happens if a PDF is broken or wrong, how prices and offers work, and personal-use terms.",
  path: "/terms",
});

export default async function TermsPage() {
  const { terms_content } = await getSettings();
  return (
    <>
      <PageHeader kicker="The small print, in plain words" title="Refunds and terms" path="/terms" crumb="Refunds and terms" />
      <section className="container-x grid border-t-[3px] border-ink pt-10 pb-20 lg:grid-cols-12">
        <RichText text={terms_content || "Terms have not been written yet."} className="lg:col-span-8 lg:col-start-3" />
      </section>
    </>
  );
}
