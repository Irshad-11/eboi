import { STORAGE_KEYS } from "@/config/analytics";
import { Wordmark } from "@/components/wordmark";

/**
 * First-visit splash. The script runs before first paint and only flags
 * <html data-splash> when: first page of the session, not the admin, not a
 * crawler, and the visitor has not asked for reduced motion. The page itself
 * renders normally underneath (SEO and loading speed are unaffected); the
 * splash only covers it for about 1.5 seconds and any tap or key skips it.
 */
const script = `(function(){try{
var k=${JSON.stringify(STORAGE_KEYS.splashSeen)};
if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1");
if(location.pathname.indexOf("/admin")===0)return;
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
if(/bot|crawl|spider|lighthouse|headless|preview|google|bing/i.test(navigator.userAgent))return;
if(window.self!==window.top)return;
var d=document.documentElement;d.setAttribute("data-splash","");
var end=function(){d.removeAttribute("data-splash")};
setTimeout(end,1800);
addEventListener("pointerdown",end,{once:true});addEventListener("keydown",end,{once:true});
}catch(e){}})();`;

export function SplashScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function SplashScreen() {
  return (
    <div className="splash" aria-hidden="true">
      <div className="grid justify-items-center gap-5">
        <div className="relative">
          <Wordmark animated className="text-brand-ink" title="" />
          <span className="splash-stamp">PDF only</span>
        </div>
        <span className="splash-skip text-sm text-text-3">Tap to skip</span>
      </div>
    </div>
  );
}
