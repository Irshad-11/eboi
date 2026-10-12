import Link from "next/link";
import { getSettings } from "@/features/settings/queries";
import { pageMetadata } from "@/features/seo/metadata";
import { PageHeader } from "@/components/page-header";
import { RichText } from "@/components/rich-text";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

export const metadata = pageMetadata({
  title: "About eBoi",
  description: "Who runs eBoi, why it sells PDFs only, and how a book gets from our shelf to your phone.",
  path: "/about",
});

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader kicker="About" title={<>One format, done properly.</>} path="/about" crumb="About" lead={settings.tagline} />
      <section className="container-x grid gap-10 border-t-[3px] border-ink pt-10 pb-20 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <dl className="space-y-4 border-l-4 border-green-900 pl-4">
            <div>
              <dt className="label text-ink-3">What we sell</dt>
              <dd className="mt-1 font-semibold">PDF books only</dd>
            </div>
            <div>
              <dt className="label text-ink-3">Where to buy</dt>
              <dd className="mt-1 font-semibold">WhatsApp, one message</dd>
            </div>
            <div>
              <dt className="label text-ink-3">Set in</dt>
              <dd className="mt-1 font-semibold">Newsreader and IBM Plex Mono</dd>
            </div>
          </dl>
        </aside>
        <div className="lg:col-span-7 lg:col-start-5">
          {settings.about_content ? (
            <RichText text={settings.about_content} className="text-lead [&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:mr-3 [&>p:first-child]:first-letter:text-[4.5rem] [&>p:first-child]:first-letter:leading-[0.85] [&>p:first-child]:first-letter:font-semibold [&>p:first-child]:first-letter:text-green-800" />
          ) : (
            <p className="text-lead text-ink-2">The About text has not been written yet. Add it in the admin under Pages.</p>
          )}
          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/shop" className="btn btn-primary">
              See the books
            </Link>
            <Link href="/how-to-buy" className="btn btn-outline">
              How buying works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
