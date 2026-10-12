import Link from "next/link";
import { SECTIONS } from "@/config/analytics";
import { TrackSection } from "@/features/analytics/track-section";
import type { HowToBuyStep } from "@/features/settings/schema";

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];

type Props = { steps: HowToBuyStep[]; deliveryNote: string; whatsappNumber: string };

/**
 * "How eBoi works", with proof instead of trust badges: the actual delivery
 * promise, how payment happens, and what happens if a file is wrong.
 */
export function HowItWorks({ steps, deliveryNote, whatsappNumber }: Props) {
  return (
    <TrackSection name={SECTIONS.howItWorks} className="border-y-[3px] border-ink bg-paper-2 py-16 md:py-24" aria-labelledby="how-title">
      <div className="container-x">
        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="label text-ink-3">How eBoi works</p>
            <h2 id="how-title" className="mt-2 text-display font-semibold">
              {NUMBER_WORDS[steps.length] ?? steps.length} steps. No account. No card form.
            </h2>
          </div>
          <p className="text-lead text-ink-2 md:col-span-5 md:col-start-8 md:self-end">
            Buying a PDF should take less time than reading its first page. Here is the whole process.
          </p>
        </div>

        <ol className="mt-12 grid border-t-[3px] border-ink sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="border-b border-ink py-6 sm:pr-6 lg:border-b-0 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
              <span className="block text-[3.5rem] leading-none font-medium text-green-700 italic tnum">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-title font-semibold">{s.title}</h3>
              {s.body && <p className="mt-2 text-ink-2">{s.body}</p>}
            </li>
          ))}
        </ol>

        <dl className="mt-12 grid gap-px border-2 border-ink bg-ink md:grid-cols-3">
          <div className="bg-paper p-5">
            <dt className="label text-green-700">Delivery</dt>
            <dd className="mt-2">{deliveryNote || "The PDF is sent in the same WhatsApp chat after payment."}</dd>
          </div>
          <div className="bg-paper p-5">
            <dt className="label text-green-700">Payment</dt>
            <dd className="mt-2">
              No card details on this site. We reply in the chat with how to pay{whatsappNumber ? "" : " once the shop number is set"}.
            </dd>
          </div>
          <div className="bg-paper p-5">
            <dt className="label text-green-700">If something is wrong</dt>
            <dd className="mt-2">
              Broken file or the wrong book? Tell us in the chat and we fix it or refund you.{" "}
              <Link href="/terms" className="link">
                Read the refund policy
              </Link>
            </dd>
          </div>
        </dl>
      </div>
    </TrackSection>
  );
}
