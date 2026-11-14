"use client";

import { useRef } from "react";
import { EASE, MEDIA, gsap, useGSAP } from "@/lib/gsap";

type HeroParallaxProps = { className?: string; children: React.ReactNode };

/**
 * Lets the hero copy leave at different speeds as the first screen scrolls away.
 * Children opt in with `data-depth` (viewport-height fraction travelled, e.g. "0.2").
 * Opacity, not visibility, so the H1 stays in the accessibility tree.
 */
export function HeroParallax({ className, children }: HeroParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", element);
        const timeline = gsap.timeline({
          defaults: { ease: EASE.none },
          scrollTrigger: { trigger: element, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        });
        layers.forEach((layer) => {
          const depth = Number(layer.dataset.depth ?? 0);
          timeline.to(layer, { y: () => -depth * window.innerHeight, duration: 1 }, 0);
          timeline.to(layer, { opacity: 0, duration: 0.5 }, 0.3);
        });
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
