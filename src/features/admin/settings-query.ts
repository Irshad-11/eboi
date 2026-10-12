import "server-only";
import { getSettings } from "@/features/settings/queries";

/**
 * Settings for the admin forms. Reuses the public reader (settings are public
 * data) so both sides always parse the jsonb lists the same way.
 */
export async function getAdminSettings() {
  return getSettings();
}
