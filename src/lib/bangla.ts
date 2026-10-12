/** True when the text contains Bengali script. */
export function hasBangla(text: string | null | undefined): boolean {
  return !!text && /[ঀ-৿]/.test(text);
}

/**
 * Returns "bn" for Bangla text so elements can set lang="bn". The stylesheet
 * uses :lang(bn) to give Hind Siliguri its own line height and tracking.
 * (The font itself is already picked automatically by unicode-range.)
 */
export function langOf(text: string | null | undefined): "bn" | undefined {
  return hasBangla(text) ? "bn" : undefined;
}
