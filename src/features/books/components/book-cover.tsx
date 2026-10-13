import Image from "next/image";
import { cn } from "@/lib/cn";
import { langOf } from "@/lib/bangla";

type Props = {
  src: string | null;
  title: string;
  author?: string;
  alt?: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Unoptimized for admin-only (draft) covers that the optimizer cannot fetch. */
  unoptimized?: boolean;
};

const FALLBACK = ["#1d5c42", "#2f4f5f", "#8a4b2d", "#55602b", "#34507a", "#7a2f3b"];

function colorFor(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return FALLBACK[h % FALLBACK.length]!;
}

/** Book cover in a fixed 2:3 frame. Books without a cover get a plain title block. */
export function BookCover({ src, title, author, alt, sizes, priority, className, unoptimized }: Props) {
  return (
    <div className={cn("cover-frame", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt || `Cover of ${title}${author ? ` by ${author}` : ""}`}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col justify-end gap-1 p-[10%] text-white [container-type:inline-size]"
          style={{ background: colorFor(title) }}
          role="img"
          aria-label={`Cover of ${title}`}
        >
          <span lang={langOf(title)} className="line-clamp-4 text-[clamp(0.5rem,11cqi,1.25rem)] leading-tight font-semibold">
            {title}
          </span>
          {author && <span className="line-clamp-1 text-[clamp(0.45rem,7cqi,0.8rem)] opacity-85">{author}</span>}
        </div>
      )}
    </div>
  );
}
