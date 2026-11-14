"use client";

import { useRef } from "react";
import { MEDIA, gsap, useGSAP } from "@/lib/gsap";
import { store } from "@/lib/store";

type InsideMotionProps = { children: React.ReactNode };

/**
 * Pins the stage and flies the copy through the camera: each beat arrives from
 * the vanishing point, rests, then passes the viewer as the next one approaches.
 */
export function InsideMotion({ children }: InsideMotionProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.reduced, () => {
        store.pins.inside = 0.5;
        return () => {
          store.pins.inside = 0;
        };
      });

      mm.add(MEDIA.motion, () => {
        element.dataset.pinned = "true";
        const stage = element.querySelector<HTMLElement>("[data-inside-stage]");
        const beats = gsap.utils.toArray<HTMLElement>("[data-beat]", element);
        if (!stage || beats.length === 0) return;

        gsap.set(beats, { autoAlpha: 0, scale: 0.35 });
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: "+=400%",
            pin: true,
            scrub: true,
            onUpdate: (self) => {
              store.pins.inside = self.progress;
            },
          },
        });

        beats.forEach((beat, index) => {
          const at = index;
          const last = index === beats.length - 1;
          timeline.to(beat, { autoAlpha: 1, scale: 1, duration: 0.42, ease: "power2.out" }, at);
          if (!last) timeline.to(beat, { autoAlpha: 0, scale: 2.8, duration: 0.36, ease: "power2.in" }, at + 0.74);
        });
        timeline.to({}, { duration: 0.3 });

        return () => {
          delete element.dataset.pinned;
          store.pins.inside = 0;
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
