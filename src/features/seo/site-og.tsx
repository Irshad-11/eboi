import "server-only";
import { ImageResponse } from "next/og";
import { BUCKETS } from "@/config/storage";
import { getSettings } from "@/features/settings/queries";
import { OG, ogFonts } from "./og-fonts";
import { storageDataUri } from "./og-image-data";
import { OgWordmark } from "./og-wordmark";

const SIZE = { width: 1200, height: 630 };

/** A share image the admin uploaded, drawn full-bleed at 1200 × 630. */
export function uploadedOgImage(src: string, fonts: Awaited<ReturnType<typeof ogFonts>>): ImageResponse {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: OG.white }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori image, not a page */}
        <img src={src} width={SIZE.width} height={SIZE.height} alt="" style={{ objectFit: "cover" }} />
      </div>
    ),
    { ...SIZE, fonts },
  );
}

/** Default share card. The admin's default share image wins when one is set. */
export async function SiteOgImage(): Promise<ImageResponse> {
  const [settings, fonts] = await Promise.all([getSettings(), ogFonts()]);
  const uploaded = await storageDataUri(BUCKETS.media, settings.default_og_image_path).catch(() => null);
  if (uploaded) return uploadedOgImage(uploaded, fonts);

  const points = ["Free preview", "bKash and Nagad", "Delivered on WhatsApp"];
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: OG.white, padding: "72px 80px", fontFamily: "Figtree", color: OG.text }}>
        <OgWordmark width={300} color={OG.brand} />
        <div style={{ display: "flex", marginTop: 56, maxWidth: 900, fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1 }}>
          {settings.tagline || "PDF books, delivered on WhatsApp"}
        </div>
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", gap: 14 }}>
          {points.map((p) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, background: OG.brandSoft, color: OG.brandInk, borderRadius: 999, padding: "12px 24px", fontSize: 28, fontWeight: 600 }}>
              <div style={{ display: "flex", width: 10, height: 10, borderRadius: 999, background: OG.brand }} />
              {p}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", position: "absolute", left: 0, right: 0, bottom: 0, height: 14, background: OG.brand }} />
      </div>
    ),
    { ...SIZE, fonts },
  );
}
