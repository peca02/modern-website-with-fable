"use client";

import { useRef } from "react";
import { IGNITION } from "@/lib/content";
import { DURATION, EASE, MEDIA, gsap, useGSAP } from "@/lib/gsap";
import { getPhase, subscribePhase, usePhase } from "./phase";

/** The chapter H2. Both lines live in the heading; ignition swaps them through a mask. */
export function IgnitionTitle({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const { ignited } = usePhase();

  useGSAP(
    (_context, contextSafe) => {
      const heading = ref.current;
      const idle = heading?.querySelector<HTMLElement>('[data-title="idle"]');
      const lit = heading?.querySelector<HTMLElement>('[data-title="ignited"]');
      if (!heading || !idle || !lit || !contextSafe) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        let wasIgnited = getPhase().ignited;
        gsap.set(lit, { yPercent: wasIgnited ? 0 : 108, opacity: 1 });
        if (wasIgnited) gsap.set(idle, { yPercent: -108 });
        else {
          gsap.from(idle, {
            yPercent: 108,
            duration: DURATION.reveal,
            ease: EASE.reveal,
            scrollTrigger: { trigger: heading, start: "top 88%", once: true },
          });
        }

        const swap = contextSafe(() => {
          const isIgnited = getPhase().ignited;
          if (isIgnited === wasIgnited) return;
          wasIgnited = isIgnited;
          gsap.to(idle, {
            yPercent: isIgnited ? -108 : 0,
            duration: DURATION.move,
            ease: EASE.move,
            overwrite: true,
          });
          gsap.to(lit, {
            yPercent: isIgnited ? 0 : 108,
            duration: isIgnited ? DURATION.reveal : DURATION.move,
            ease: isIgnited ? EASE.reveal : EASE.move,
            delay: isIgnited ? 0.3 : 0,
            overwrite: true,
          });
        });
        return subscribePhase(swap);
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <h2 ref={ref} id="ignition-title" className={`type-display grid ${className}`}>
      <span
        aria-hidden={ignited}
        className={`col-start-1 row-start-1 overflow-hidden pr-[0.25em] ${ignited ? "motion-reduce:invisible" : ""}`}
      >
        <span data-title="idle" className="block">
          {IGNITION.title}
        </span>
      </span>
      <span
        aria-hidden={!ignited}
        className={`col-start-1 row-start-1 overflow-hidden pr-[0.25em] ${ignited ? "" : "motion-reduce:invisible"}`}
      >
        <span data-title="ignited" className="block text-glow motion-safe:opacity-0">
          <em className="italic">{IGNITION.ignited}</em>
        </span>
      </span>
    </h2>
  );
}
