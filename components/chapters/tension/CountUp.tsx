"use client";

import { useRef } from "react";
import { DURATION, EASE, MEDIA, gsap, useGSAP } from "@/lib/gsap";

type CountUpProps = { value: string; className?: string };

/** Counts from zero to the server-rendered figure when it scrolls into view. */
export function CountUp({ value, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const element = ref.current;
      const target = Number(value);
      if (!element || Number.isNaN(target)) return;
      const decimals = value.split(".")[1]?.length ?? 0;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const counter = { current: 0 };
        gsap.to(counter, {
          current: target,
          duration: DURATION.reveal * 1.5,
          ease: EASE.reveal,
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
          onStart: () => {
            element.textContent = (0).toFixed(decimals);
          },
          onUpdate: () => {
            element.textContent = counter.current.toFixed(decimals);
          },
          onComplete: () => {
            element.textContent = value;
          },
        });
        return () => {
          element.textContent = value;
        };
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
