import { cn } from "@/lib/cn";
import { renderableHtml } from "@/lib/rich-text";

/** Renders stored rich text (sanitised again here) with the site's prose styles. */
export function RichText({ html, className }: { html: string | null | undefined; className?: string }) {
  const safe = renderableHtml(html);
  if (!safe) return null;
  return <div className={cn("prose-shop", className)} dangerouslySetInnerHTML={{ __html: safe }} />;
}
