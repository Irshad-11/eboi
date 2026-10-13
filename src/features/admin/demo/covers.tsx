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

const dataUri = (png: Uint8Array) => `data:image/png;base64,${Buffer.from(png).toString("base64")}`;

/**
 * Demo hero banner image (desktop 1600 × 500 or phone 900 × 600): headline,
 * line, a button shape and the real demo covers fanned on the right.
 */
export async function renderDemoBanner(
  b: { title: string; subtitle: string; button_label: string; bg_color: string; text_color: string },
  covers: Uint8Array[],
  size: { width: number; height: number },
): Promise<Uint8Array> {
  const fonts = await ogFonts();
  const mobile = size.height > size.width * 0.5;
  const coverW = mobile ? 170 : 210;
  const coverH = Math.round(coverW * 1.5);
  const dark = b.text_color.toLowerCase() === "#ffffff";
  const res = new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: b.bg_color, color: b.text_color, fontFamily: "Figtree", overflow: "hidden" }}>
        <div style={{ display: "flex", position: "absolute", right: mobile ? -120 : -60, top: mobile ? 180 : -140, width: mobile ? 620 : 760, height: mobile ? 620 : 760, borderRadius: 9999, background: dark ? "rgba(255,255,255,0.08)" : "rgba(29,92,66,0.08)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: mobile ? "flex-start" : "center", padding: mobile ? "56px 56px" : "0 96px", width: mobile ? "100%" : 820 }}>
          <div style={{ display: "flex", fontSize: mobile ? 58 : 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1 }}>{b.title}</div>
          <div style={{ display: "flex", marginTop: 18, fontSize: mobile ? 30 : 30, lineHeight: 1.35, opacity: 0.9, maxWidth: mobile ? 520 : 640 }}>{b.subtitle}</div>
          <div style={{ display: "flex", marginTop: 32 }}>
            <div style={{ display: "flex", background: dark ? "#ffffff" : "#1d5c42", color: dark ? "#0f2a1f" : "#ffffff", borderRadius: 12, padding: "16px 32px", fontSize: 28, fontWeight: 600 }}>{b.button_label}</div>
          </div>
        </div>
        <div style={{ display: "flex", position: "absolute", right: mobile ? 40 : 110, bottom: mobile ? 36 : (size.height - coverH) / 2 }}>
          {covers.slice(0, 3).map((c, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- Satori image, not a page
            <img
              key={i}
              src={dataUri(c)}
              width={coverW}
              height={coverH}
              alt=""
              style={{
                marginLeft: i === 0 ? 0 : -coverW * 0.35,
                transform: `rotate(${(i - 1) * 6}deg) translateY(${i === 1 ? -14 : 0}px)`,
                borderRadius: 6,
                boxShadow: "0 16px 32px rgba(0,0,0,0.28)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
  return new Uint8Array(await res.arrayBuffer());
}

/** Small page images matching the demo preview PDF, for the book page thumbnails. */
export async function renderDemoThumbs(b: DemoBook, count = 4): Promise<Uint8Array[]> {
  const fonts = await ogFonts();
  const W = 360;
  const H = 510;
  const title = b.coverTitle ?? b.title;
  const author = b.coverAuthor ?? b.author;
  const toc = b.toc.split("\n").filter(Boolean).map((l) => l.replace(/[^\x20-\x7E -ÿ–—’]/g, "").trim()).filter(Boolean);
  const paras = b.previewText.length ? b.previewText : ["Preview text."];
  const page = (n: number) => {
    if (n === 1)
      return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
          <div style={{ display: "flex", height: 137, background: "#0f2a1f" }} />
          <div style={{ display: "flex", flexDirection: "column", padding: "44px 40px 0" }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 600, lineHeight: 1.1 }}>{title}</div>
            <div style={{ display: "flex", marginTop: 12, fontSize: 15, fontStyle: "italic", fontWeight: 500, color: "#5c6a61" }}>{b.subtitle}</div>
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", padding: "0 40px 60px", fontSize: 16 }}>{author}</div>
        </div>
      );
    if (n === 2)
      return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "56px 40px" }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 600 }}>Contents</div>
          {(toc.length ? toc : ["Chapter one", "Chapter two", "Chapter three"]).slice(0, 9).map((l, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 12.5 }}>
              <span>{l.slice(0, 40)}</span>
              <span style={{ color: "#5c6a61" }}>{7 + i * 18}</span>
            </div>
          ))}
        </div>
      );
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "52px 40px" }}>
        {n === 3 && <div style={{ display: "flex", fontSize: 20, fontWeight: 600, marginBottom: 18 }}>{(toc[0] ?? "Beginning").replace(/^\d+\.\s*/, "").slice(0, 34)}</div>}
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", marginBottom: 10, fontSize: 11.5, lineHeight: 1.45 }}>
            {paras[(n + i) % paras.length]}
          </div>
        ))}
      </div>
    );
  };
  const out: Uint8Array[] = [];
  for (let n = 1; n <= count; n++) {
    const res = new ImageResponse(
      (
        <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: "#ffffff", color: "#14201a", fontFamily: "Newsreader", overflow: "hidden" }}>
          {page(n)}
        </div>
      ),
      { width: W, height: H, fonts },
    );
    out.push(new Uint8Array(await res.arrayBuffer()));
  }
  return out;
}
