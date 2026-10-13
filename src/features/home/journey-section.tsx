import { SECTIONS } from "@/config/analytics";
import { SectionHead } from "@/components/section-head";
import { TrackSection } from "@/features/analytics/track-section";
import { OrderSteps } from "@/features/journey/order-steps";
import type { Step } from "@/features/settings/schema";

export function JourneySection({ steps }: { steps: Step[] }) {
  if (!steps.length) return null;
  return (
    <TrackSection name={SECTIONS.journey} className="container-x py-4 md:py-5" aria-labelledby="journey-title">
      <div className="rounded-lg border border-line bg-white p-5 md:p-7">
        <SectionHead id="journey-title" title="How to order" href="/how-to-order" linkLabel="Details" className="md:mb-6" />
        <OrderSteps steps={steps} />
      </div>
    </TrackSection>
  );
}
