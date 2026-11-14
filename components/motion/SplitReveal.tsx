"use client";

import { useRef } from "react";
import { DURATION, EASE, MEDIA, STAGGER, SplitText, gsap, useGSAP } from "@/lib/gsap";
import { on, store } from "@/lib/store";

type SplitRevealProps = {
  as?: "h1" | "h2" | "h3" | "p" | "blockquote" | "span";
  /** lines: masked line-by-line rise. chars: per-character rise for short display type. */
  by?: "lines" | "chars";
  /** scroll: plays when scrolled into view. loaded: plays when the preloader hands off. */
  when?: "scroll" | "loaded";
  delay?: number;
  id?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * The site's one text entrance. SplitText keeps an aria-label on the element,
 * so screen readers still get the sentence in one piece.
 */
export function SplitReveal({ as: Tag = "p", by = "lines", when = "scroll", delay = 0, id, className, children }: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        let split: SplitText | undefined;
        let cancelled = false;
        let offLoaded: (() => void) | undefined;

        document.fonts.ready.then(() => {
          if (cancelled) return;
          split = SplitText.create(element, {
            type: by === "chars" ? "words,chars" : "lines",
            mask: by === "chars" ? "words" : "lines",
            autoSplit: true,
            onSplit(self) {
              const targets = by === "chars" ? self.chars : self.lines;
              const tween = gsap.from(targets, {
                yPercent: 108,
                duration: DURATION.reveal,
                ease: EASE.reveal,
                stagger: by === "chars" ? STAGGER.chars : STAGGER.lines,
                delay,
                paused: when === "loaded" && !store.load.done,
                scrollTrigger: when === "scroll" ? { trigger: element, start: "top 88%", once: true } : undefined,
              });
              if (when === "loaded" && !store.load.done) {
                offLoaded?.();
                offLoaded = on("loaded", () => tween.play());
              }
              return tween;
            },
          });
        });

        return () => {
          cancelled = true;
          offLoaded?.();
          split?.revert();
        };
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag
      id={id}
      className={className}
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
    >
      {children}
    </Tag>
  );
}
