"use client";

import { formatDate } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { BannerRow } from "@/lib/supabase/database.types";
import { deleteBanner, reorderBanners } from "../actions/banners";
import { BannerEditor } from "./banner-editor";
import { DeleteButton } from "./delete-button";
import { OrderList } from "./order-list";

function status(b: BannerRow): { label: string; cls: string } {
  const now = Date.now();
  if (!b.is_active) return { label: "Off", cls: "badge-soft" };
  if (b.start_at && Date.parse(b.start_at) > now) return { label: `From ${formatDate(b.start_at)}`, cls: "badge-warn" };
  if (b.end_at && Date.parse(b.end_at) <= now) return { label: "Ended", cls: "badge-soft" };
  return { label: "Live", cls: "badge-ok" };
}

export function BannerList({ banners }: { banners: BannerRow[] }) {
  return (
    <OrderList
      items={banners}
      onSave={reorderBanners}
      empty={<p className="p-6 text-center text-base text-text-2">No banners yet. The carousel is hidden until you add one.</p>}
      render={(b) => {
        const st = status(b);
        const img = mediaUrl(b.image_desktop_path ?? b.image_mobile_path);
        return (
          <div className="flex items-center gap-3">
            <div className="relative aspect-[16/5] w-28 shrink-0 overflow-hidden rounded-md border border-line sm:w-40" style={{ background: b.bg_color }}>
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                <img src={img} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center px-2 text-xs font-semibold" style={{ color: b.text_color }}>
                  <span className="line-clamp-2">{b.title}</span>
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{b.title || b.alt_text || "Image banner"}</p>
              <p className="flex flex-wrap items-center gap-2 text-sm text-text-3">
                <span className={`badge ${st.cls}`}>{st.label}</span>
                {b.link_url && <span className="truncate">{b.link_url}</span>}
                {b.is_demo && <span className="badge badge-soft">Demo</span>}
              </p>
            </div>
            <BannerEditor banner={b} />
            <DeleteButton compact label="this banner" consequence="The banner and its images are deleted." action={deleteBanner.bind(null, b.id)} />
          </div>
        );
      }}
    />
  );
}
