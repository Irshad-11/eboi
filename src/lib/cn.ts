/** Joins class names, skipping falsy values. Small on purpose: no clsx needed. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
