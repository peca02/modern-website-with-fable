"use client";

import { useRef, useState } from "react";
import { DURATION, EASE, MEDIA, ScrollSmoother, gsap, useGSAP } from "@/lib/gsap";
import { SITE } from "@/lib/site";
import { on, store } from "@/lib/store";

type Phase = "loading" | "leaving" | "gone";

const DIGITS = [0, 1, 2] as const;

/**
 * Displays the load clock over the scene's first shot. It never covers the canvas:
 * it only shows the count and holds scrolling until the clock is done.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>(() => (store.load.done ? "gone" : "loading"));

  useGSAP(
    (_context, contextSafe) => {
      const element = root.current;
      if (!element || !contextSafe || store.load.done) return;

      const digits = gsap.utils.toArray<HTMLElement>("[data-digit]", element);
      const fades = gsap.utils.toArray<HTMLElement>("[data-fade]", element);
      const rule = element.querySelector<HTMLElement>("[data-rule]");
      const setRule = rule ? gsap.quickSetter(rule, "scaleX") : undefined;

      const smoother = ScrollSmoother.get();
      const html = document.documentElement;
      if (smoother) smoother.paused(true);
      else html.style.overflow = "hidden";
      const unlock = () => {
        ScrollSmoother.get()?.paused(false);
        html.style.overflow = "";
      };

      let shown = -1;
      const write = (progress: number) => {
        const value = Math.round(progress * 100);
        setRule?.(progress);
        if (value === shown) return;
        shown = value;
        const text = String(value).padStart(DIGITS.length, "0");
        digits.forEach((digit, index) => {
          digit.textContent = text[index];
        });
      };
      const onTick = () => write(store.load.shown);
      gsap.ticker.add(onTick);

      const leave = contextSafe(() => {
        gsap.ticker.remove(onTick);
        write(1);
        unlock();
        if (window.matchMedia(MEDIA.reduced).matches) {
          setPhase("gone");
          return;
        }
        setPhase("leaving");
        gsap
          .timeline({ delay: 0.2, onComplete: () => setPhase("gone") })
          .to(digits, { yPercent: -110, duration: DURATION.move, ease: EASE.move, stagger: 0.06 })
          .to(fades, { autoAlpha: 0, duration: DURATION.move, ease: EASE.move }, 0)
          .to(rule, { scaleX: 0, transformOrigin: "right center", duration: DURATION.move, ease: EASE.move }, 0);
      });
      const offLoaded = on("loaded", leave);

      return () => {
        offLoaded();
        gsap.ticker.remove(onTick);
        unlock();
      };
    },
    { scope: root },
  );

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {phase === "loading" ? "Loading…" : "Loaded"}
      </p>
      {phase === "gone" ? null : (
        <div
          ref={root}
          aria-hidden="true"
          className={`fixed inset-0 z-50 flex flex-col justify-between noscript:hidden ${
            phase === "loading" ? "" : "pointer-events-none"
          }`}
        >
          <div className="grid-page h-16 items-center md:h-20">
            <p data-fade className="type-micro col-span-2 text-bone md:col-span-6">
              {SITE.legalName}
            </p>
            <p data-fade className="type-micro col-span-2 text-right text-ash md:col-span-6">
              Winding field line
            </p>
          </div>

          <div className="grid-page items-end gap-y-4 pb-6 md:pb-10">
            <p className="type-counter col-span-3 flex text-mega text-bone md:col-span-8">
              {DIGITS.map((digit) => (
                <span key={digit} className="overflow-clip">
                  <span data-digit className="block will-change-transform">
                    0
                  </span>
                </span>
              ))}
            </p>
            <p data-fade className="type-micro col-span-1 pb-2 text-right text-ash md:col-span-4 md:pb-6">
              <span className="text-plasma">/</span> 100
            </p>
            <div data-fade className="relative col-span-full h-px bg-rule">
              <div data-rule className="absolute inset-0 origin-left scale-x-0 bg-plasma" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
