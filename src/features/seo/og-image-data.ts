import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

/** A private storage file as a data URI, for drawing inside Satori images. */
export async function storageDataUri(bucket: string, path: string | null | undefined): Promise<string | null> {
  if (!path || !isSupabaseConfigured) return null;
  const { data } = await createServiceClient().storage.from(bucket).download(path);
  if (!data) return null;
  const type = data.type && data.type.startsWith("image/") ? data.type : path.endsWith(".png") ? "image/png" : path.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return `data:${type};base64,${Buffer.from(await data.arrayBuffer()).toString("base64")}`;
}
