import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { BUCKETS } from "@/config/storage";
import { isSupabaseConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { coverUrl } from "@/features/books/cover";
import { getAdminUser } from "@/features/admin/auth";

/**
 * Streams a cover from the PRIVATE covers bucket.
 * - Published books: public, cached for a year (URL carries a version).
 * - Drafts: only for the signed-in admin, never cached.
 * next/image and the OG image generator both read covers through here.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/cover/[id]">) {
  const { id } = await ctx.params;
  if (!isSupabaseConfigured || !z.uuid().safeParse(id).success) return notFound();

  const supabase = createServiceClient();
  const { data: book } = await supabase.from("books").select("id, cover_path, status").eq("id", id).maybeSingle();
  if (!book?.cover_path) return notFound();

  const isPublic = book.status === "published";
  if (!isPublic && !(await getAdminUser())) return notFound();

  const { data: file, error } = await supabase.storage.from(BUCKETS.covers).download(book.cover_path);
  if (error || !file) return notFound();

  // Only the current versioned URL may be cached long-term.
  const expected = coverUrl(book);
  const isCurrent = expected === `${req.nextUrl.pathname}${req.nextUrl.search}`;
  const cache = !isPublic
    ? "private, no-store"
    : isCurrent
      ? "public, max-age=31536000, immutable"
      : "public, max-age=300";

  return new NextResponse(file.stream(), {
    headers: {
      "Content-Type": file.type || (book.cover_path.endsWith(".png") ? "image/png" : "image/jpeg"),
      "Content-Length": String(file.size),
      "Cache-Control": cache,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
}
