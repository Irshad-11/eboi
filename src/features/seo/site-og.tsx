import "server-only";
import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";
import { OG, ogFonts } from "./og-fonts";
import { OgWordmark } from "./og-wordmark";

/** Default share card: the nameplate, the promise, and how it works in one line. */
export async function SiteOgImage(): Promise<ImageResponse> {
  const fonts = await ogFonts();
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: OG.paper, padding: "64px 72px", fontFamily: "Newsreader", color: OG.ink }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Plex Mono", fontSize: 20, letterSpacing: 3, color: OG.ink3, textTransform: "uppercase", borderBottom: `2px solid ${OG.ink}`, paddingBottom: 14 }}>
          <span>A small PDF bookshop</span>
          <span>Dhaka</span>
        </div>
        <div style={{ display: "flex", marginTop: 46 }}>
          <OgWordmark width={520} color={OG.green900} />
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 64, fontWeight: 600, letterSpacing: -1.5, lineHeight: 1.02 }}>
          Read the first pages.&nbsp;
          <span style={{ fontStyle: "italic", fontWeight: 500, color: OG.green700 }}>Then decide.</span>
        </div>
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `5px solid ${OG.ink}`, paddingTop: 18, fontSize: 28, color: OG.ink3 }}>
          <span>{SITE.defaultTagline}</span>
          <span style={{ fontFamily: "Plex Mono", fontSize: 22 }}>Preview free · Buy on WhatsApp</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}
