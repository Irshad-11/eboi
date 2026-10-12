import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPublishedBooks, toLite } from "@/features/books/queries";

const idsSchema = z.array(z.uuid()).max(30);

/**
 * Public book data for IDs held in the visitor's browser (My List, recently
 * viewed). Returns only published books, with server-computed prices.
 */
export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const parsed = idsSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ books: [] }, { status: 400 });

  const all = await getPublishedBooks();
  const byId = new Map(all.map((b) => [b.id, b]));
  const books = parsed.data.flatMap((id) => {
    const b = byId.get(id);
    return b ? [toLite(b)] : [];
  });

  return NextResponse.json(
    { books },
    // Prices can change when an offer starts, so keep the shared cache short.
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
