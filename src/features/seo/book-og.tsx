import "server-only";
import { ImageResponse } from "next/og";
import { BUCKETS } from "@/config/storage";
import { isSupabaseConfigured } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { hasBangla } from "@/lib/bangla";
import { createServiceClient } from "@/lib/supabase/service";
import { getBookBySlug } from "@/features/books/queries";
import { getSettings } from "@/features/settings/queries";
import { OG, ogFonts } from "./og-fonts";
import { OgWordmark } from "./og-wordmark";
import { SiteOgImage } from "./site-og";

export const OG_SIZE = { width: 1200, height: 630 };

async function coverDataUri(path: string | null): Promise<string | null> {
  if (!path || !isSupabaseConfigured) return null;
  const { data } = await createServiceClient().storage.from(BUCKETS.covers).download(path);
  if (!data) return null;
  const type = data.type || (path.endsWith(".png") ? "image/png" : "image/jpeg");
  return `data:${type};base64,${Buffer.from(await data.arrayBuffer()).toString("base64")}`;
}

/**
 * Per-book share card for WhatsApp, Facebook and X: the real cover on the
 * right, title and price set like a catalogue entry on the left.
 */
export async function renderBookOg(slug: string): Promise<ImageResponse> {
  const book = await getBookBySlug(slug);
  if (!book) return SiteOgImage();
  const [settings, fonts, cover] = await Promise.all([getSettings(), ogFonts(), coverDataUri(book.cover_path)]);

  // Satori cannot shape Bengali script. Bangla titles lean on the cover image,
  // which already carries the title, and show the Latin subtitle if any.
  const bangla = hasBangla(book.title);
  const title = bangla ? (book.subtitle && !hasBangla(book.subtitle) ? book.subtitle : "A Bangla PDF book") : book.title;
  const size = title.length > 60 ? 52 : title.length > 32 ? 64 : 78;
  const p = book.pricing;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: OG.paper, fontFamily: "Newsreader", color: OG.ink }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "56px 40px 48px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Plex Mono", fontSize: 20, letterSpacing: 3, color: OG.ink3, textTransform: "uppercase" }}>
            <span>{book.book_code}</span>
            <span>·</span>
            <span>{book.category}</span>
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: size, fontWeight: 600, lineHeight: 1.0, letterSpacing: -1.5 }}>{title}</div>
          {!bangla && book.author ? (
            <div style={{ display: "flex", marginTop: 22, fontSize: 32, fontStyle: "italic", fontWeight: 500, color: OG.green700 }}>
              by {book.author}
            </div>
          ) : null}
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderTop: `5px solid ${OG.ink}`, paddingTop: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, fontFamily: "Plex Mono" }}>
              <span style={{ fontSize: 46 }}>{formatPrice(p.final, settings.currency_symbol)}</span>
              {p.was != null ? (
                <span style={{ fontSize: 26, color: OG.ink3, textDecoration: "line-through" }}>{formatPrice(p.was, settings.currency_symbol)}</span>
              ) : null}
            </div>
            <OgWordmark width={150} color={OG.green900} />
          </div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 24, color: OG.ink3 }}>Read the first pages free. Buy on WhatsApp.</div>
        </div>
        <div style={{ display: "flex", width: 470, background: OG.green900, alignItems: "center", justifyContent: "center" }}>
          {cover ? (
            <img src={cover} width={300} height={450} alt="" style={{ objectFit: "cover", boxShadow: `10px 12px 0 0 ${OG.green950}`, border: `2px solid ${OG.green950}` }} />
          ) : (
            <div style={{ display: "flex", width: 300, height: 450, background: OG.green800, color: OG.paper, padding: 30, fontSize: 40, fontWeight: 600, alignItems: "flex-end", boxShadow: `10px 12px 0 0 ${OG.green950}` }}>
              {title}
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
