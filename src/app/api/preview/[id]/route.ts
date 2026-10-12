import { NextResponse } from "next/server";
import { z } from "zod";
import { BUCKETS } from "@/config/storage";
import { SIGNED_URL_TTL_SECONDS } from "@/config/limits";
import { isSupabaseConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminUser } from "@/features/admin/auth";

/**
 * Hands the preview viewer a short-lived signed URL for the PRIVATE preview
 * PDF. The permanent storage path never reaches the browser, and the URL
 * expires in seconds, so a copied link is useless.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/preview/[id]">) {
  const { id } = await ctx.params;
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  if (!isSupabaseConfigured || !z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  }

  const supabase = createServiceClient();
  const { data: book } = await supabase.from("books").select("preview_path, status").eq("id", id).maybeSingle();
  if (!book?.preview_path || (book.status !== "published" && !(await getAdminUser()))) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  }

  const { data, error } = await supabase.storage
    .from(BUCKETS.previews)
    .createSignedUrl(book.preview_path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    console.error("[preview] sign failed:", error?.message);
    return NextResponse.json({ error: "Preview unavailable" }, { status: 502, headers });
  }
  return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS }, { headers });
}
