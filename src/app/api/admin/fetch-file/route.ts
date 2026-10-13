import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/features/admin/auth";

/**
 * Admin only: downloads a PDF, JSON or image from a link so the admin can
 * use "Paste link" instead of a file. The browser then checks and uploads it
 * exactly like a picked file. Share links from Google Drive and Dropbox are
 * turned into direct downloads.
 */
const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 20_000;
const KINDS = {
  pdf: { types: ["application/pdf", "application/octet-stream", "binary/octet-stream"], name: "file.pdf" },
  json: { types: ["application/json", "text/plain", "application/octet-stream", "text/json"], name: "book.json" },
  image: { types: ["image/jpeg", "image/png", "image/webp", "image/gif"], name: "image" },
} as const;

export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Admin only" }, { status: 401 });
  const kind = req.nextUrl.searchParams.get("kind") as keyof typeof KINDS | null;
  const raw = req.nextUrl.searchParams.get("url") ?? "";
  if (!kind || !(kind in KINDS)) return NextResponse.json({ error: "Unknown file kind." }, { status: 400 });
  const url = directLink(raw);
  if (!url) return NextResponse.json({ error: "Paste a full https:// link." }, { status: 400 });

  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": "eBoi admin file fetch" } });
  } catch {
    return NextResponse.json({ error: "That link could not be reached." }, { status: 502 });
  }
  if (!res.ok || !res.body) return NextResponse.json({ error: `The link answered ${res.status}. Is the file shared publicly?` }, { status: 502 });
  const type = (res.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (type === "text/html") return NextResponse.json({ error: "That link opens a web page, not the file. Use a direct download link." }, { status: 415 });
  if (type && !(KINDS[kind].types as readonly string[]).includes(type)) {
    return NextResponse.json({ error: `That link is a ${type} file, not the expected type.` }, { status: 415 });
  }
  if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) return NextResponse.json({ error: "That file is larger than 8 MB." }, { status: 413 });

  // Read with a hard size cap (content-length can be missing or wrong).
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      return NextResponse.json({ error: "That file is larger than 8 MB." }, { status: 413 });
    }
    chunks.push(value);
  }
  const body = new Blob(chunks as BlobPart[]);
  const name = fileName(url, KINDS[kind].name);
  return new NextResponse(body, {
    headers: {
      "content-type": kind === "pdf" ? "application/pdf" : kind === "json" ? "application/json" : type || "application/octet-stream",
      "x-file-name": encodeURIComponent(name),
      "cache-control": "no-store",
    },
  });
}

/** Public http(s) links only, with Drive and Dropbox share links made direct. */
function directLink(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  // Never fetch this server's own network.
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.startsWith("[")
  ) {
    return null;
  }
  const drive = /drive\.google\.com\/file\/d\/([\w-]+)/.exec(u.href);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  if (host.endsWith("dropbox.com")) {
    u.searchParams.set("dl", "1");
    return u.href;
  }
  return u.href;
}

function fileName(url: string, fallback: string): string {
  const last = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
  return /\.[a-z0-9]{2,5}$/i.test(last) ? last.slice(-120) : fallback;
}
