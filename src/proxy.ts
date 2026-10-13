import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 1. /admin: refreshes the Supabase session cookie and sends signed-out
 *    visitors to the login page. Every admin page and action checks admin
 *    status again on the server, and RLS checks it in the database.
 * 2. Everything else: applies the manual redirects from Admin > SEO.
 *    The list is small, so it is cached in memory for a minute.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) return adminGate(request, url, key);
  return manualRedirect(request, url, key);
}

async function adminGate(request: NextRequest, url: string, key: string) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === "/admin/login";
  if (!data.user && !isLogin) {
    if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Admin only" }, { status: 401 });
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    return NextResponse.redirect(login);
  }
  return response;
}

type RedirectMap = Map<string, { to: string; status: 301 | 302 }>;
let cache: { at: number; map: RedirectMap } | null = null;
const TTL = 60_000;

async function loadRedirects(url: string, key: string): Promise<RedirectMap> {
  if (cache && Date.now() - cache.at < TTL) return cache.map;
  const map: RedirectMap = new Map();
  try {
    const res = await fetch(`${url}/rest/v1/redirects?select=source_path,destination,status_code&is_active=eq.true`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (res.ok) {
      const rows = (await res.json()) as { source_path: string; destination: string; status_code: number }[];
      for (const r of rows) map.set(normalise(r.source_path), { to: r.destination, status: r.status_code === 302 ? 302 : 301 });
    }
  } catch {
    // Redirects are best effort; never block a page because of them.
  }
  cache = { at: Date.now(), map };
  return map;
}

function normalise(path: string): string {
  const p = path.split("?")[0]!.replace(/\/+$/, "");
  return (p || "/").toLowerCase();
}

async function manualRedirect(request: NextRequest, url: string, key: string) {
  const map = await loadRedirects(url, key);
  if (!map.size) return NextResponse.next();
  const hit = map.get(normalise(request.nextUrl.pathname));
  if (!hit) return NextResponse.next();
  const target = /^https?:\/\//i.test(hit.to) ? new URL(hit.to) : new URL(hit.to, request.url);
  return NextResponse.redirect(target, hit.status);
}

export const config = {
  // Skip Next.js internals, API routes (except admin) and files with an extension.
  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};
