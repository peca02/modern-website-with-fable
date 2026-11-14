"use client";

import { useRef } from "react";
import { EASE, MEDIA, gsap, useGSAP } from "@/lib/gsap";

type ComparisonBarsProps = {
  /** Shorter value divided by the longer one: where the growing bar starts. */
  ratio: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * Both bars share one scale. The `data-bar="grow"` hairline starts at the short bar's
 * length and is pulled out to full width by the scroll, so the gap is felt, not read.
 */
export function ComparisonBars({ ratio, className, children }: ComparisonBarsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        gsap.fromTo(
          '[data-bar="grow"]',
          { scaleX: ratio },
          {
            scaleX: 1,
            ease: EASE.none,
            scrollTrigger: { trigger: element, start: "top 75%", end: "bottom 55%", scrub: true },
          },
        );
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
