import Link from "next/link";
import { SECTIONS } from "@/config/analytics";
import { TrackSection } from "@/features/analytics/track-section";
import { IconArrow } from "@/components/icons";
import { paragraphs } from "@/lib/text";

/** The first paragraph of About becomes a pull quote. Short, then a link. */
export function AboutTeaser({ about }: { about: string }) {
  const [lead, second] = paragraphs(about);
  if (!lead) return null;
  return (
    <TrackSection name={SECTIONS.about} className="container-x py-16 md:py-28" aria-labelledby="about-title">
      <div className="grid gap-8 md:grid-cols-12">
        <p className="label text-ink-3 md:col-span-2">
          <span id="about-title">About eBoi</span>
        </p>
        <blockquote className="md:col-span-7">
          <p className="text-headline font-medium italic">{lead}</p>
        </blockquote>
        <div className="md:col-span-3 md:self-end">
          {second && <p className="text-ink-2">{second}</p>}
          <Link href="/about" className="group mt-4 inline-flex min-h-11 items-center gap-2 font-semibold">
            <span className="link">The longer story</span>
            <IconArrow size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </TrackSection>
  );
}
