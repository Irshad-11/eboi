import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/features/admin/auth";
import { toBookJson } from "@/features/books/json";

/**
 * Admin-only JSON export. ?id=<uuid> exports one book as an object (ready to
 * re-import with its files); no id exports every book as an array (a backup
 * of all metadata).
 */
export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Admin only" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (id && !z.uuid().safeParse(id).success) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const supabase = await createSessionClient();
  let query = supabase.from("books").select("*").order("book_code");
  if (id) query = query.eq("id", id);
  let reviewQuery = supabase.from("book_reviews").select("*").order("sort_order");
  if (id) reviewQuery = reviewQuery.eq("book_id", id);
  const [{ data: books, error }, { data: members }, { data: cols }, { data: reviews }] = await Promise.all([
    query,
    supabase.from("collection_books").select("book_id, collection_id"),
    supabase.from("collections").select("id, slug"),
    reviewQuery,
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (id && !books?.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slugById = new Map((cols ?? []).map((c) => [c.id, c.slug]));
  const out = (books ?? []).map((b) =>
    toBookJson(
      b,
      (members ?? []).filter((m) => m.book_id === b.id).flatMap((m) => (slugById.has(m.collection_id) ? [slugById.get(m.collection_id)!] : [])),
      publicEnv.siteUrl,
      (reviews ?? []).filter((r) => r.book_id === b.id),
    ),
  );
  const body = JSON.stringify(id ? out[0] : out, null, 2);
  const name = id ? `${out[0]!.book_code}-${out[0]!.slug}.json` : `eboi-books-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
