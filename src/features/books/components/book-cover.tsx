import Image from "next/image";
import { cn } from "@/lib/cn";
import { langOf } from "@/lib/bangla";

type Props = {
  src: string | null;
  title: string;
  author?: string;
  /** next/image sizes hint. Keep it honest: it decides how many bytes phones download. */
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * The one cover treatment used everywhere: 2:3 crop, flat, hard offset
 * shadow, printed spine. Books without a cover get a typeset stand-in in the
 * same frame instead of a grey box.
 */
export function BookCover({ src, title, author, sizes, priority, className }: Props) {
  return (
    <div className={cn("cover", className)}>
      {src ? (
        <Image
          src={src}
          alt={`Cover of ${title}${author ? ` by ${author}` : ""}`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between bg-green-800 p-[9%] pl-[13%] text-paper">
          <span className="micro text-green-300">eBoi PDF</span>
          <span lang={langOf(title)} className="text-[clamp(0.9rem,3.2vw,1.5rem)] leading-tight font-semibold">
            {title}
          </span>
          {author ? <span className="micro text-green-100">{author}</span> : <span />}
        </div>
      )}
    </div>
  );
}
