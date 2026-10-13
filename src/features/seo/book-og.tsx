import "server-only";
import { ImageResponse } from "next/og";
import { BUCKETS } from "@/config/storage";
import { formatPrice } from "@/lib/format";
import { hasBangla } from "@/lib/bangla";
import { getBookBySlug } from "@/features/books/queries";
import { discountLabel } from "@/features/offers/pricing";
import { getSettings } from "@/features/settings/queries";
import { OG, ogFonts } from "./og-fonts";
import { storageDataUri } from "./og-image-data";
import { OgWordmark } from "./og-wordmark";
import { SiteOgImage, uploadedOgImage } from "./site-og";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Per-book share card for WhatsApp, Facebook and X: title, author and price
 * on the left, the real cover on the right. A share image set on the book
 * in the admin is used instead when there is one.
 */
export async function renderBookOg(slug: string): Promise<ImageResponse> {
  const book = await getBookBySlug(slug);
  if (!book) return SiteOgImage();
  const [settings, fonts] = await Promise.all([getSettings(), ogFonts()]);
  const uploaded = await storageDataUri(BUCKETS.media, book.og_image_path).catch(() => null);
  if (uploaded) return uploadedOgImage(uploaded, fonts);
  const cover = await storageDataUri(BUCKETS.covers, book.cover_path).catch(() => null);

  // Satori cannot shape Bengali script. Bangla titles lean on the cover image,
  // which already carries the title, and show the Latin subtitle if any.
  const bangla = hasBangla(book.title);
  const title = bangla ? (book.subtitle && !hasBangla(book.subtitle) ? book.subtitle : "A Bangla PDF book") : book.title;
  const size = title.length > 60 ? 50 : title.length > 32 ? 60 : 72;
  const p = book.pricing;
  const sym = settings.currency_symbol;
  const off = discountLabel(p, sym);
  const meta = [book.category, bangla ? null : book.language, book.page_count ? `${book.page_count} pages` : null].filter(Boolean).join(" · ");

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: OG.white, fontFamily: "Figtree", color: OG.text }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "64px 48px 56px 72px" }}>
          <div style={{ display: "flex", fontSize: 26, color: OG.text3 }}>{meta}</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: size, fontWeight: 700, lineHeight: 1.08, letterSpacing: -0.5 }}>{title}</div>
          {!bangla && book.author ? <div style={{ display: "flex", marginTop: 18, fontSize: 32, color: OG.text2 }}>by {book.author}</div> : null}
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 56, fontWeight: 700, color: off ? OG.sale : OG.text }}>{formatPrice(p.final, sym)}</span>
            {p.was != null ? <span style={{ fontSize: 32, color: OG.text3, textDecoration: "line-through" }}>{formatPrice(p.was, sym)}</span> : null}
            {off ? <span style={{ display: "flex", background: OG.sale, color: OG.white, borderRadius: 8, padding: "6px 14px", fontSize: 26, fontWeight: 700 }}>{off}</span> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28 }}>
            <span style={{ fontSize: 26, color: OG.text2 }}>Free preview · Order on WhatsApp</span>
            <OgWordmark width={140} color={OG.brand} />
          </div>
        </div>
        <div style={{ display: "flex", width: 440, background: OG.brandSoft, alignItems: "center", justifyContent: "center" }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- Satori image, not a page
            <img src={cover} width={300} height={450} alt="" style={{ objectFit: "cover", borderRadius: 6, boxShadow: "0 18px 40px rgba(16,24,20,0.25)" }} />
          ) : (
            <div style={{ display: "flex", width: 300, height: 450, borderRadius: 6, background: OG.brand, color: OG.white, padding: 30, fontSize: 38, fontWeight: 700, alignItems: "flex-end" }}>{title}</div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
