import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { trackPayloadSchema } from "@/features/analytics/schema";
import { deviceFromUserAgent, isBotUserAgent } from "@/features/analytics/device";

/**
 * Beacon receiver. Writes with the service role because visitors have no
 * write access to `events` at all (RLS). Never reads the IP address.
 * Always answers 204: the browser does not need to know what happened.
 */
export async function POST(req: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  if (!isSupabaseConfigured) return done;

  const ua = req.headers.get("user-agent");
  if (isBotUserAgent(ua)) return done;

  const raw = await req.text().catch(() => "");
  if (!raw || raw.length > 4096) return done;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return done;
  }
  const parsed = trackPayloadSchema.safeParse(json);
  if (!parsed.success) return done;
  const p = parsed.data;

  const { error } = await createServiceClient()
    .from("events")
    .upsert(
      {
        type: p.type,
        book_id: p.bookId ?? null,
        section: p.section || null,
        term: p.term || null,
        result_count: p.resultCount ?? null,
        page: p.page ?? null,
        path: p.path || null,
        referrer: p.referrer || null,
        device: deviceFromUserAgent(ua ?? ""),
        anon_id: p.anonId,
        session_id: p.sessionId,
        dedupe_key: p.dedupeKey,
      },
      // The unique (session_id, dedupe_key) index is the server-side dedupe.
      { onConflict: "session_id,dedupe_key", ignoreDuplicates: true },
    );

  // A deleted book id (FK violation) or a duplicate is expected noise.
  if (error && error.code !== "23503") console.error("[track] insert failed:", error.message);
  return done;
}
