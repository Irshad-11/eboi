import { cn } from "@/lib/cn";
import { langOf } from "@/lib/bangla";
import { paragraphs } from "@/lib/text";

/**
 * Renders admin-written plain text without a Markdown dependency:
 *   blank line         -> new paragraph
 *   short line alone   -> heading (no ending punctuation, under 60 characters)
 *   lines starting "- " -> bullet list
 * Plain text in, React elements out: no HTML injection is possible.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("prose-eboi", className)}>
      {paragraphs(text).map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim());
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-[square] space-y-1 pl-5 marker:text-green-700">
              {lines.map((l, j) => (
                <li key={j} lang={langOf(l)}>
                  {l.slice(2)}
                </li>
              ))}
            </ul>
          );
        }
        if (lines.length === 1 && block.length < 60 && !/[.!?:,;।]$/.test(block)) {
          return (
            <h2 key={i} lang={langOf(block)} className="font-semibold">
              {block}
            </h2>
          );
        }
        return (
          <p key={i} lang={langOf(block)} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}
