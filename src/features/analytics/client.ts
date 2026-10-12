import { STORAGE_KEYS, type EventType } from "@/config/analytics";

/**
 * Browser-side tracking.
 *
 * Privacy: visitors get a random anonymous ID (localStorage + a first-party
 * cookie). No IP address is read or stored anywhere, no fingerprinting.
 * Delivery: navigator.sendBeacon, so tracking never delays a click or a page
 * unload. Dedupe: each (type, book, section, ...) is sent once per session.
 */

type TrackData = {
  bookId?: string | null;
  section?: string | null;
  term?: string | null;
  resultCount?: number | null;
  page?: number | null;
  /** Override the dedupe key (default: type + book + section + term + page). */
  dedupe?: string;
};

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|bingpreview|pingdom|gtmetrix/i;
const ONE_YEAR = 60 * 60 * 24 * 365;

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    // Private mode or blocked storage: tracking degrades, the site does not.
    return fallback;
  }
}

function randomId(): string {
  return safe(() => crypto.randomUUID().replace(/-/g, ""), Math.random().toString(36).slice(2) + Date.now().toString(36));
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

/** Anonymous visitor ID shared by analytics and personalisation. */
export function getAnonId(): string {
  const key = STORAGE_KEYS.anonId;
  let id = safe(() => localStorage.getItem(key), null) || readCookie(key);
  if (!id || id.length < 8) id = randomId();
  safe(() => localStorage.setItem(key, id), undefined);
  // The cookie mirrors localStorage so the ID survives either being cleared.
  document.cookie = `${key}=${id}; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  return id;
}

export function getSessionId(): string {
  const key = STORAGE_KEYS.sessionId;
  let id = safe(() => sessionStorage.getItem(key), null);
  if (!id) {
    id = randomId();
    safe(() => sessionStorage.setItem(key, id!), undefined);
  }
  return id;
}

export function isBotLike(): boolean {
  return navigator.webdriver === true || BOT_UA.test(navigator.userAgent);
}

let seenCache: Set<string> | null = null;
function seen(): Set<string> {
  seenCache ??= new Set(safe(() => JSON.parse(sessionStorage.getItem(STORAGE_KEYS.dedupe) || "[]") as string[], []));
  return seenCache;
}

function markSeen(key: string) {
  const s = seen();
  s.add(key);
  const list = [...s].slice(-400);
  safe(() => sessionStorage.setItem(STORAGE_KEYS.dedupe, JSON.stringify(list)), undefined);
}

/** External referrer host only (never full URLs, which can carry personal data). */
function referrerHost(): string | null {
  return safe(() => {
    if (!document.referrer) return null;
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    return host && host !== location.hostname ? host.slice(0, 120) : null;
  }, null);
}

export function track(type: EventType, data: TrackData = {}): void {
  if (typeof window === "undefined" || isBotLike()) return;
  const key = (data.dedupe ?? [type, data.bookId, data.section, data.term?.toLowerCase(), data.page].join("|")).slice(0, 200);
  if (seen().has(key)) return;
  markSeen(key);

  const body = JSON.stringify({
    type,
    bookId: data.bookId ?? null,
    section: data.section ?? null,
    term: data.term ?? null,
    resultCount: data.resultCount ?? null,
    page: data.page ?? null,
    path: location.pathname.slice(0, 300),
    referrer: referrerHost(),
    anonId: getAnonId(),
    sessionId: getSessionId(),
    dedupeKey: key,
  });

  const sent = safe(
    () => typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" })),
    false,
  );
  if (!sent) {
    void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(
      () => undefined,
    );
  }
}
