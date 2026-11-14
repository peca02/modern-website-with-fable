"use client";

import { useRef } from "react";
import { DURATION, EASE, MEDIA, gsap, useGSAP } from "@/lib/gsap";
import { on, store } from "@/lib/store";

type ScrollHintProps = { label: string; className?: string };

/** Micro label with a hairline that a brighter thread keeps being pulled through. */
export function ScrollHint({ label, className = "" }: ScrollHintProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const entrance = gsap.from(element, {
          autoAlpha: 0,
          duration: DURATION.reveal,
          ease: EASE.reveal,
          delay: 1.1,
          paused: !store.load.done,
        });
        const offLoaded = store.load.done ? undefined : on("loaded", () => entrance.play());

        gsap.fromTo(
          "[data-thread]",
          { xPercent: -101 },
          { xPercent: 101, duration: DURATION.reveal * 1.5, ease: EASE.move, repeat: -1, repeatDelay: 0.4 },
        );

        return () => offLoaded?.();
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <p ref={ref} className={`type-micro flex items-center gap-4 text-ash ${className}`}>
      <span aria-hidden="true" className="relative block h-px w-16 overflow-hidden bg-rule">
        <span data-thread className="absolute inset-0 bg-plasma" />
      </span>
      <span>{label}</span>
    </p>
  );
}
