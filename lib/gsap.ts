import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, SplitText);

/** The motion language: every DOM animation picks from these. */
export const EASE = {
  reveal: "expo.out",
  move: "power3.inOut",
  micro: "power2.out",
  none: "none",
} as const;

export const DURATION = {
  reveal: 1.4,
  move: 0.9,
  micro: 0.3,
} as const;

export const STAGGER = {
  lines: 0.09,
  chars: 0.018,
  items: 0.06,
} as const;

export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 1024px)",
  finePointer: "(hover: hover) and (pointer: fine)",
} as const;

gsap.defaults({ ease: EASE.reveal, duration: DURATION.reveal });
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, useGSAP };
