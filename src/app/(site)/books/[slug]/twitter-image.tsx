import { renderBookOg, OG_SIZE } from "@/features/seo/book-og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "eBoi PDF book";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderBookOg(slug);
}
