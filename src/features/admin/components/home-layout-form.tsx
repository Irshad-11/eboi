"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HOME_SECTION_TYPES, type HomeSection, type HomeSectionType } from "@/features/settings/schema";
import { IconArrowDown, IconArrowUp } from "@/components/icons";
import { saveHomeLayout } from "../actions/settings";
import { Toggle } from "./field";
import { Notice } from "./notice";

const LINKS: Partial<Record<HomeSectionType, { href: string; label: string }>> = {
  hero: { href: "/admin/banners", label: "Edit banners" },
  categories: { href: "/admin/categories", label: "Edit categories" },
  offers: { href: "/admin/offers", label: "Edit offers" },
  collections: { href: "/admin/collections", label: "Pick and order collections" },
  collection_tiles: { href: "/admin/collections", label: "Collection images" },
  journey: { href: "/admin/settings", label: "Edit steps" },
  faq: { href: "/admin/pages", label: "Edit questions" },
};

/** Show, hide and reorder home page sections. */
export function HomeLayoutForm({ sections }: { sections: HomeSection[] }) {
  const router = useRouter();
  const all = Object.keys(HOME_SECTION_TYPES) as HomeSectionType[];
  // Sections added in later versions appear at the end, switched off.
  const [list, setList] = useState<HomeSection[]>(() => [...sections, ...all.filter((t) => !sections.some((s) => s.type === t)).map((type) => ({ type, enabled: false }))]);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const move = (i: number, d: -1 | 1) =>
    setList((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const n = [...l];
      [n[i], n[j]] = [n[j]!, n[i]!];
      return n;
    });

  return (
    <div className="space-y-4">
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <ol className="divide-y divide-line rounded-lg border border-line bg-white">
        {list.map((s, i) => (
          <li key={s.type} className="flex flex-wrap items-center gap-3 px-3 py-2.5 md:px-4">
            <div className="flex">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn btn-ghost btn-icon btn-sm" aria-label={`Move ${HOME_SECTION_TYPES[s.type]} up`}>
                <IconArrowUp size={16} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="btn btn-ghost btn-icon btn-sm" aria-label={`Move ${HOME_SECTION_TYPES[s.type]} down`}>
                <IconArrowDown size={16} />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <Toggle id={`hs-${s.type}`} label={HOME_SECTION_TYPES[s.type]} checked={s.enabled} onChange={(c) => setList((l) => l.map((x, j) => (j === i ? { ...x, enabled: c } : x)))} />
            </div>
            {LINKS[s.type] && (
              <Link href={LINKS[s.type]!.href} className="link text-sm">
                {LINKS[s.type]!.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="btn btn-primary"
        data-loading={pending}
        onClick={() =>
          start(async () => {
            const res = await saveHomeLayout({ home_sections: list });
            setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
            if (res.ok) router.refresh();
          })
        }
      >
        Save layout
      </button>
    </div>
  );
}
