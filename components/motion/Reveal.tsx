"use client";

import { useRef } from "react";
import { DURATION, EASE, MEDIA, STAGGER, gsap, useGSAP } from "@/lib/gsap";
import { on, store } from "@/lib/store";

type RevealProps = {
  /** fade: opacity only. rise: opacity plus a short lift. rule: hairlines draw from the left. */
  kind?: "fade" | "rise" | "rule";
  /** Animate the direct children one after another instead of the wrapper. */
  stagger?: boolean;
  when?: "scroll" | "loaded";
  delay?: number;
  className?: string;
  children?: React.ReactNode;
};

/** Entrance for non-text blocks. Text uses SplitReveal. */
export function Reveal({ kind = "fade", stagger = false, when = "scroll", delay = 0, className, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const targets = stagger ? Array.from(element.children) : element;
        const from =
          kind === "rule"
            ? { scaleX: 0, transformOrigin: "left center" }
            : kind === "rise"
              ? { autoAlpha: 0, y: 32 }
              : { autoAlpha: 0 };
        const tween = gsap.from(targets, {
          ...from,
          duration: DURATION.reveal,
          ease: EASE.reveal,
          stagger: stagger ? STAGGER.items : 0,
          delay,
          paused: when === "loaded" && !store.load.done,
          scrollTrigger: when === "scroll" ? { trigger: element, start: "top 88%", once: true } : undefined,
        });
        const offLoaded = when === "loaded" && !store.load.done ? on("loaded", () => tween.play()) : undefined;
        return () => offLoaded?.();
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
