"use client";

import { useRef } from "react";
import { EASE, MEDIA, gsap, useGSAP } from "@/lib/gsap";
import { store } from "@/lib/store";

type YieldTrackProps = { children: React.ReactNode };

const REDUCED_PROGRESS = 0.5;

/**
 * Pins the roadmap stage and turns vertical scroll into the track's horizontal
 * travel. Without motion the markup stays the vertical ordered list it is.
 */
export function YieldTrack({ children }: YieldTrackProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.reduced, () => {
        store.pins.yield = REDUCED_PROGRESS;
        return () => {
          store.pins.yield = 0;
        };
      });

      mm.add(MEDIA.motion, () => {
        const stage = element.querySelector<HTMLElement>("[data-yield-stage]");
        const track = element.querySelector<HTMLElement>("[data-yield-track]");
        const fill = element.querySelector<HTMLElement>("[data-yield-fill]");
        if (!stage || !track) return;
        element.dataset.pinned = "true";

        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const setFill = fill ? gsap.quickSetter(fill, "scaleX") : undefined;
        const apply = (progress: number) => {
          store.pins.yield = progress;
          setFill?.(progress);
        };

        gsap.to(track, {
          x: () => -distance(),
          ease: EASE.none,
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => apply(self.progress),
            onRefresh: (self) => apply(self.progress),
          },
        });

        return () => {
          delete element.dataset.pinned;
          store.pins.yield = 0;
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
