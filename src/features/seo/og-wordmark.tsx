import { WORDMARK_PATHS, WORDMARK_VIEWBOX } from "@/components/wordmark";

/** The wordmark as a single-colour SVG for Satori images. */
export function OgWordmark({ width, color }: { width: number; color: string }) {
  const [, , w, h] = WORDMARK_VIEWBOX.split(" ").map(Number);
  return (
    <svg width={width} height={Math.round((width * h!) / w!)} viewBox={WORDMARK_VIEWBOX}>
      <path fill={color} d={[...WORDMARK_PATHS.letters, WORDMARK_PATHS.dot, WORDMARK_PATHS.rule].join(" ")} />
    </svg>
  );
}
