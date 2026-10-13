import { SECTIONS } from "@/config/analytics";
import { HOME } from "@/config/site";
import { SectionHead } from "@/components/section-head";
import { FaqList } from "@/components/faq-list";
import { TrackSection } from "@/features/analytics/track-section";
import type { FaqItem } from "@/features/settings/schema";

export function FaqSection({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <TrackSection name={SECTIONS.faq} className="container-x py-4 md:py-5" aria-labelledby="faq-title">
      <SectionHead id="faq-title" title="Questions" href="/faq" linkLabel="All questions" />
      <FaqList items={items.slice(0, HOME.faqCount)} />
    </TrackSection>
  );
}
