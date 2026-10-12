import Link from "next/link";
import { getSettings } from "@/features/settings/queries";
import { formatWhatsappNumber } from "@/features/whatsapp/message";
import { pageMetadata } from "@/features/seo/metadata";
import { PageHeader } from "@/components/page-header";

// Must be a literal for Next.js static analysis. Keep in sync with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

export const metadata = pageMetadata({
  title: "How to buy a PDF on eBoi",
  description: "Pick a book, read the free preview, send one WhatsApp message, pay, and receive the PDF in the same chat.",
  path: "/how-to-buy",
});

export default async function HowToBuyPage() {
  const s = await getSettings();
  const number = formatWhatsappNumber(s.whatsapp_number);
  return (
    <>
      <PageHeader
        kicker="How to buy"
        title={<>Four steps. One message.</>}
        path="/how-to-buy"
        crumb="How to buy"
        lead="No account to create, no card to type in. If you can send a WhatsApp message, you can buy a book here."
      />
      <section className="container-x pb-16">
        <ol className="border-t-[3px] border-ink">
          {s.how_to_buy_steps.map((step, i) => (
            <li key={step.title} className="grid gap-3 border-b border-ink py-8 md:grid-cols-12 md:gap-8">
              <span className="text-[4rem] leading-none font-medium text-green-700 italic tnum md:col-span-2 md:text-[5.5rem]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-headline font-semibold md:col-span-4 md:pt-2">{step.title}</h2>
              <p className="text-lead text-ink-2 md:col-span-5 md:col-start-8 md:pt-3">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y-[3px] border-ink bg-paper-2 py-14">
        <div className="container-x grid gap-10 md:grid-cols-2">
          <div>
            <p className="label text-ink-3">Buying several books?</p>
            <h2 className="mt-2 text-headline font-semibold">Use My List, send once.</h2>
            <p className="mt-4 text-ink-2">
              Tap “Add to My List” on each book. Then open My List and send all of them in a single message. We reply with one
              total. It is not a cart: no quantities, nothing is reserved, nothing is charged.
            </p>
            <Link href="/my-list" className="btn btn-outline mt-6">
              Open My List
            </Link>
          </div>
          <div>
            <p className="label text-ink-3">Delivery</p>
            <h2 className="mt-2 text-headline font-semibold">Same chat, same day.</h2>
            <p className="mt-4 text-ink-2">{s.delivery_note}</p>
            {number && (
              <p className="mt-4">
                Our WhatsApp: <span className="font-mono font-semibold">{number}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <Link href="/shop" className="btn btn-primary">
          Pick a book
        </Link>
        <Link href="/faq" className="btn btn-quiet ml-4">
          Read the questions
        </Link>
      </section>
    </>
  );
}
