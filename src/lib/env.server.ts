import "server-only";

/**
 * Server-only secrets. Importing this file from a client component fails the
 * build (via `server-only`), so the service role key cannot leak by accident.
 */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env (server only).");
  }
  return key;
}
