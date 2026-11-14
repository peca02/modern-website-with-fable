"use client";

import { useRef } from "react";
import { EASE, MEDIA, gsap, useGSAP } from "@/lib/gsap";

type TitleDriftProps = { className?: string; children: React.ReactNode };

/**
 * Scrubbed kinetic type: descendants with `data-drift` slide sideways by that many
 * viewport-width percent while the block crosses the screen, so stacked lines pull apart.
 */
export function TitleDrift({ className, children }: TitleDriftProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        gsap.utils.toArray<HTMLElement>("[data-drift]", element).forEach((line) => {
          const drift = Number(line.dataset.drift ?? 0);
          gsap.to(line, {
            x: () => (drift * window.innerWidth) / 100,
            ease: EASE.none,
            scrollTrigger: { trigger: element, start: "top 70%", end: "bottom top", scrub: true, invalidateOnRefresh: true },
          });
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
