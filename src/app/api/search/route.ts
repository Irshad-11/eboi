import { NextResponse, type NextRequest } from "next/server";
import { getPublishedBooks, toLite } from "@/features/books/queries";
import { searchScore } from "@/features/books/catalog";

/** Live search suggestions for the header: up to 6 books, best matches first. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ books: [], total: 0 });
  const scored = (await getPublishedBooks())
    .map((b) => ({ b, s: searchScore(b, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.b.total_sells - a.b.total_sells);
  return NextResponse.json(
    { books: scored.slice(0, 6).map((x) => toLite(x.b)), total: scored.length },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
