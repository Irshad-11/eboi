/** Server-side bot filter and device class from the User-Agent header. */
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|whatsapp|telegrambot|preview|python|curl|wget|httpclient|axios|node-fetch|go-http/i;

export function isBotUserAgent(ua: string | null): boolean {
  return !ua || BOT.test(ua);
}

export function deviceFromUserAgent(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))|kindle|silk/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}
