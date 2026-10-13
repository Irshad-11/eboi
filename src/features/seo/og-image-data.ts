import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

/** A private storage file as a data URI, for drawing inside Satori images. */
export async function storageDataUri(bucket: string, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) {
    // A pasted image link: fetch it (with a time limit) and inline it.
    const res = await fetch(path, { signal: AbortSignal.timeout(5000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(png|jpe?g)/.test(type)) return null;
    return `data:${type.split(";")[0]};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  }
  if (!isSupabaseConfigured) return null;
  const { data } = await createServiceClient().storage.from(bucket).download(path);
  if (!data) return null;
  const type = data.type && data.type.startsWith("image/") ? data.type : path.endsWith(".png") ? "image/png" : path.endsWith(".webp") ? "image/webp" : "image/jpeg";
  // The share card renderer reads PNG and JPEG only (GIF/WebP fall back to the drawn card).
  if (!/^image\/(png|jpe?g)/.test(type)) return null;
  return `data:${type};base64,${Buffer.from(await data.arrayBuffer()).toString("base64")}`;
}
