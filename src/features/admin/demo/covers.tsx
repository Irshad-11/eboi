import "server-only";
import { ImageResponse } from "next/og";
import { ogFonts } from "@/features/seo/og-fonts";
import type { DemoBook } from "./data";

/**
 * Typographic demo covers, drawn on the server with Satori (no stock images,
 * no illustration). Five layouts so the shelf does not look like one template.
 * Every cover carries a DEMO stamp.
 */
export const COVER_SIZE = { width: 800, height: 1200 };

export async function renderDemoCover(b: DemoBook): Promise<Uint8Array> {
  const fonts = await ogFonts();
  const { bg, fg, accent, style } = b.cover;
  const title = b.coverTitle ?? b.title;
  const author = b.coverAuthor ?? b.author;
  const size = title.length > 24 ? 92 : title.length > 14 ? 112 : 140;

  const stamp = (
    <div style={{ display: "flex", position: "absolute", top: 40, right: 40, border: `3px solid ${fg}`, color: fg, padding: "6px 14px", fontFamily: "Plex Mono", fontSize: 24, letterSpacing: 4, opacity: 0.8 }}>
      DEMO
    </div>
  );
  const kicker = (
    <div style={{ display: "flex", fontFamily: "Plex Mono", fontSize: 26, letterSpacing: 5, textTransform: "uppercase", color: fg, opacity: 0.75 }}>{b.category}</div>
  );
  const authorLine = (
    <div style={{ display: "flex", fontSize: 44, fontStyle: "italic", fontWeight: 500, color: fg }}>{author}</div>
  );

  let body: React.ReactNode;
  switch (style) {
    case "rule":
      body = (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "90px 80px 80px" }}>
          {kicker}
          <div style={{ display: "flex", marginTop: 60, fontSize: size, fontWeight: 600, lineHeight: 0.95, letterSpacing: -3, color: fg }}>{title}</div>
          <div style={{ display: "flex", marginTop: 50, height: 16, background: accent, width: "100%" }} />
          <div style={{ display: "flex", marginTop: 34, fontSize: 38, lineHeight: 1.25, color: fg, opacity: 0.9 }}>{b.subtitle}</div>
          <div style={{ display: "flex", flex: 1 }} />
          {authorLine}
        </div>
      );
      break;
    case "stack":
      body = (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "80px" }}>
          {kicker}
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {title.split(" ").map((w, i) => (
              <div key={i} style={{ display: "flex", fontSize: size * 1.05, fontWeight: 600, lineHeight: 0.92, letterSpacing: -3, color: i % 2 ? accent : fg }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 50, borderTop: `6px solid ${fg}`, paddingTop: 26, justifyContent: "space-between", alignItems: "flex-end" }}>
            {authorLine}
          </div>
        </div>
      );
      break;
    case "split":
      body = (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", height: 640, padding: "90px 80px 50px", justifyContent: "flex-end" }}>
            {kicker}
            <div style={{ display: "flex", marginTop: 40, fontSize: size, fontWeight: 600, lineHeight: 0.95, letterSpacing: -3, color: fg }}>{title}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, background: fg, padding: "50px 80px 80px" }}>
            <div style={{ display: "flex", fontSize: 40, lineHeight: 1.25, color: bg }}>{b.subtitle}</div>
            <div style={{ display: "flex", flex: 1 }} />
            <div style={{ display: "flex", fontSize: 44, fontStyle: "italic", fontWeight: 500, color: accent }}>{author}</div>
          </div>
        </div>
      );
      break;
    case "frame":
      body = (
        <div style={{ display: "flex", flex: 1, padding: 50 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, border: `4px solid ${accent}`, padding: "70px 56px", alignItems: "center" }}>
            {kicker}
            <div style={{ display: "flex", flex: 1 }} />
            <div style={{ display: "flex", fontSize: size, fontWeight: 600, lineHeight: 0.98, letterSpacing: -2, color: fg, textAlign: "center" }}>{title}</div>
            <div style={{ display: "flex", width: 120, height: 6, background: accent, marginTop: 50 }} />
            <div style={{ display: "flex", marginTop: 40, fontSize: 36, lineHeight: 1.3, color: fg, textAlign: "center", opacity: 0.9 }}>{b.subtitle}</div>
            <div style={{ display: "flex", flex: 1 }} />
            {authorLine}
          </div>
        </div>
      );
      break;
    case "grid":
      body = (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "80px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `4px solid ${fg}`, paddingBottom: 20 }}>
            {kicker}
          </div>
          <div style={{ display: "flex", marginTop: 40, gap: 18 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", width: 90, height: 90, background: i === 2 ? accent : "transparent", border: `4px solid ${fg}` }} />
            ))}
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", fontSize: size, fontWeight: 600, lineHeight: 0.95, letterSpacing: -3, color: fg }}>{title}</div>
          <div style={{ display: "flex", marginTop: 30, fontSize: 36, lineHeight: 1.25, color: fg, opacity: 0.85 }}>{b.subtitle}</div>
          <div style={{ display: "flex", marginTop: 50 }}>{authorLine}</div>
        </div>
      );
      break;
  }

  const res = new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: bg, fontFamily: "Newsreader" }}>
        {body}
        {stamp}
      </div>
    ),
    { ...COVER_SIZE, fonts },
  );
  return new Uint8Array(await res.arrayBuffer());
}
