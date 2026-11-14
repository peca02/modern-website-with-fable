"use client";

import { useRef } from "react";
import { MEDIA, gsap, useGSAP } from "@/lib/gsap";

type MagneticProps = {
  /** How far the content leans toward the pointer, as a fraction of the offset. */
  strength?: number;
  className?: string;
  children: React.ReactNode;
};

/** Wraps one interactive element and makes it lean toward a fine pointer. */
export function Magnetic({ strength = 0.3, className, children }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(`${MEDIA.finePointer} and ${MEDIA.motion}`, () => {
        const xTo = gsap.quickTo(element, "x", { duration: 0.6, ease: "power3.out" });
        const yTo = gsap.quickTo(element, "y", { duration: 0.6, ease: "power3.out" });
        const onMove = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect();
          xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
          yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
        };
        const onLeave = () => {
          xTo(0);
          yTo(0);
        };
        element.addEventListener("pointermove", onMove);
        element.addEventListener("pointerleave", onLeave);
        return () => {
          element.removeEventListener("pointermove", onMove);
          element.removeEventListener("pointerleave", onLeave);
        };
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={`inline-block will-change-transform ${className ?? ""}`}>
      {children}
    </span>
  );
}
