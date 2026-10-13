import { NextResponse } from "next/server";
import { BUCKETS } from "@/config/storage";
import { isSupabaseConfigured } from "@/lib/env";
import { isMediaPath } from "@/lib/media";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Streams banners, category/collection images, preview thumbnails and share
 * images from the private media bucket. Names are random and never reused,
 * so responses are immutable.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const path = parts.map(decodeURIComponent).join("/");
  if (!isSupabaseConfigured || !isMediaPath(path)) return notFound();

  const { data: file, error } = await createServiceClient().storage.from(BUCKETS.media).download(path);
  if (error || !file) return notFound();

  const ext = path.split(".").pop();
  return new NextResponse(file.stream(), {
    headers: {
      "Content-Type": file.type || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg"),
      "Content-Length": String(file.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
}
