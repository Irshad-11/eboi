import { getImageProps } from "next/image";
import { BANNER } from "@/config/limits";
import { mediaUrl, skipOptimizer } from "@/lib/media";
import type { Banner } from "@/features/banners/queries";
import { HeroCarousel, type Slide } from "./hero-carousel";

/**
 * Builds art-directed <picture> elements on the server (desktop 16:5,
 * phone 3:2) and hands them to the carousel. Only the first slide is
 * loaded eagerly with high priority.
 */
export function HeroSection({ banners, interval }: { banners: Banner[]; interval: number }) {
  if (!banners.length) return null;
  const slides: Slide[] = banners.map((b, i) => {
    const desktopSrc = mediaUrl(b.image_desktop_path ?? b.image_mobile_path);
    const mobileSrc = mediaUrl(b.image_mobile_path ?? b.image_desktop_path);
    let picture = null;
    if (desktopSrc && mobileSrc) {
      const common = {
        alt: b.alt_text || b.title || "",
        sizes: "(min-width: 1280px) 1232px, 100vw",
        priority: i === 0,
        // GIFs and pasted links are used as they are (animations keep playing).
        unoptimized: skipOptimizer(desktopSrc) || skipOptimizer(mobileSrc),
      };
      const {
        props: { srcSet: desktop },
      } = getImageProps({ ...common, src: desktopSrc, width: BANNER.desktop.width, height: BANNER.desktop.height });
      const {
        props: { srcSet: mobile, ...rest },
      } = getImageProps({ ...common, src: mobileSrc, width: BANNER.mobile.width, height: BANNER.mobile.height });
      picture = (
        <picture>
          <source media="(min-width: 768px)" srcSet={desktop ?? desktopSrc} />
          <source media="(max-width: 767px)" srcSet={mobile ?? mobileSrc} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is inside rest */}
          <img {...rest} className="h-full w-full object-cover" />
        </picture>
      );
    }
    return {
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      buttonLabel: b.button_label,
      href: b.link_url,
      alt: b.alt_text,
      bg: b.bg_color,
      fg: b.text_color,
      overlay: b.overlay_text,
      picture,
    };
  });
  return (
    <div className="container-x pt-4 md:pt-5">
      <HeroCarousel slides={slides} interval={interval} />
    </div>
  );
}
