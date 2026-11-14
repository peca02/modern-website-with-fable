"use client";

import { useRef } from "react";
import { IGNITION } from "@/lib/content";
import { DURATION, EASE, MEDIA, STAGGER, gsap, useGSAP } from "@/lib/gsap";
import { getPhase, subscribePhase, usePhase } from "./phase";

const STAGE_COUNT = String(IGNITION.stages.length).padStart(2, "0");

/**
 * All five heating stages as an ordered list. With motion it condenses to the current
 * stage, swapped through line masks; in reduced motion the whole list is laid out.
 */
export function StageList({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { stage, ignited } = usePhase();
  const current = IGNITION.stages[stage];
  const announcement = ignited ? IGNITION.ignited : stage > 0 ? `${current.name}. ${current.detail}` : "";

  useGSAP(
    (_context, contextSafe) => {
      const root = ref.current;
      if (!root || !contextSafe) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const lines = gsap.utils
          .toArray<HTMLElement>("[data-stage]", root)
          .map((item) => gsap.utils.toArray<HTMLElement>("[data-line]", item));
        let shown = getPhase().stage;
        lines.forEach((group, index) => {
          if (index !== shown) gsap.set(group, { yPercent: 108 });
        });

        const swap = contextSafe(() => {
          const next = getPhase().stage;
          if (next === shown) return;
          const direction = next > shown ? 1 : -1;
          lines.forEach((group, index) => {
            if (index === next) {
              gsap.fromTo(
                group,
                { yPercent: 108 * direction },
                {
                  yPercent: 0,
                  duration: DURATION.move,
                  ease: EASE.reveal,
                  stagger: STAGGER.lines,
                  delay: 0.12,
                  overwrite: true,
                },
              );
            } else if (index === shown) {
              gsap.to(group, { yPercent: -108 * direction, duration: DURATION.micro, ease: "power2.in", overwrite: true });
            } else {
              gsap.set(group, { yPercent: 108, overwrite: true });
            }
          });
          shown = next;
        });
        return subscribePhase(swap);
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      <ol className="grid motion-reduce:gap-8">
        {IGNITION.stages.map((item, index) => {
          const active = index === stage;
          return (
            <li
              key={item.name}
              data-stage
              aria-current={active ? "step" : undefined}
              className={`flex flex-col gap-2 transition-opacity duration-300 motion-safe:col-start-1 motion-safe:row-start-1 ${
                active ? "" : "motion-safe:pointer-events-none motion-safe:opacity-0 motion-reduce:text-ash"
              }`}
            >
              <p className="type-micro overflow-hidden text-ash">
                <span data-line className="block">
                  <span className="text-plasma">{String(index + 1).padStart(2, "0")}</span> / {STAGE_COUNT}
                </span>
              </p>
              <h3 className="type-title overflow-hidden pb-1">
                <span data-line className="block">
                  {item.name}
                </span>
              </h3>
              <p className="max-w-sm overflow-hidden font-sans text-small leading-normal md:text-body">
                <span data-line className="block">
                  {item.detail}
                </span>
              </p>
            </li>
          );
        })}
      </ol>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
