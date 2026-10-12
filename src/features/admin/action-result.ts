import type { z } from "zod";

/** What every server action returns. Errors are messages for humans, never stack traces. */
export type ActionResult<T = undefined> =
  | ({ ok: true; message?: string } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fail(error: string, fieldErrors?: Record<string, string>): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  return { ok: false, error, fieldErrors };
}

/** First zod message per field, keyed by the top-level field name. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    out[key] ??= issue.message;
  }
  return out;
}

/** Turns a Postgres error into a sentence. */
export function dbError(error: { code?: string; message: string }, what = "save"): string {
  if (error.code === "23505") {
    if (/slug/i.test(error.message)) return "That slug is already used (or was used before). Pick another.";
    if (/book_code/i.test(error.message)) return "That Book ID already exists.";
    return "Something with the same unique value already exists.";
  }
  if (error.code === "42501") return "Not allowed. Are you still signed in as the admin?";
  if (error.code === "23514") return `A value is out of range: ${error.message}`;
  return `Could not ${what}: ${error.message}`;
}
