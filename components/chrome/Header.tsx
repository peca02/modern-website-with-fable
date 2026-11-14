"use client";

import { useRef } from "react";
import { ChapterNav } from "@/components/chrome/ChapterNav";
import { SkeinMark } from "@/components/chrome/SkeinMark";
import { SoundToggle } from "@/components/chrome/SoundToggle";
import { scrollToAnchor } from "@/components/chrome/scrollToAnchor";
import { DURATION, EASE, MEDIA, ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { CHAPTERS, SITE } from "@/lib/site";
import { on, store } from "@/lib/store";

const HIDE_VELOCITY = 900;
const SHOW_VELOCITY = -200;
const TOP_ZONE = 0.004;

export function Header() {
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const header = root.current;
      const barElement = bar.current;
      if (!header || !barElement) return;
      const fill = header.querySelector<HTMLElement>("[data-progress]");
      const ticks = gsap.utils.toArray<HTMLElement>("[data-tick]", header);
      const setFill = fill ? gsap.quickSetter(fill, "scaleX") : undefined;

      const reveal = () => {
        const reduced = window.matchMedia(MEDIA.reduced).matches;
        gsap.to(header, { autoAlpha: 1, duration: reduced ? 0 : DURATION.reveal, ease: EASE.reveal, delay: reduced ? 0 : 0.4 });
      };
      const offLoaded = store.load.done ? undefined : on("loaded", reveal);
      if (store.load.done) gsap.set(header, { autoAlpha: 1 });

      // Ticks sit where each chapter really starts, pins included, so they come from the tracker's triggers.
      const placeTicks = () => {
        const max = ScrollTrigger.maxScroll(window);
        const triggers = ScrollTrigger.getAll();
        ticks.forEach((tick, index) => {
          const section = document.querySelector(`[data-chapter="${CHAPTERS[index].id}"]`);
          const tracker = triggers.find((item) => item.trigger === section && !item.pin && item.vars.refreshPriority === -1);
          const at = tracker && max > 0 ? gsap.utils.clamp(0, 1, tracker.start / max) : index / CHAPTERS.length;
          tick.style.left = `${at * 100}%`;
        });
      };
      placeTicks();
      ScrollTrigger.addEventListener("refresh", placeTicks);

      let hidden = false;
      const setHidden = (next: boolean) => {
        if (next === hidden) return;
        hidden = next;
        gsap.to(barElement, { yPercent: next ? -100 : 0, duration: DURATION.move, ease: EASE.move, overwrite: true });
      };
      const isEngaged = () =>
        header.contains(document.activeElement) || header.querySelector('[aria-expanded="true"]') !== null;

      let lastProgress = -1;
      const onTick = () => {
        const { progress, velocity } = store.scroll;
        if (progress === lastProgress) return;
        lastProgress = progress;
        setFill?.(progress);
        if (store.motion.reduced) return;
        if (progress < TOP_ZONE || velocity < SHOW_VELOCITY) setHidden(false);
        else if (velocity > HIDE_VELOCITY && !isEngaged()) setHidden(true);
      };
      gsap.ticker.add(onTick);

      const onFocusIn = () => setHidden(false);
      header.addEventListener("focusin", onFocusIn);

      return () => {
        offLoaded?.();
        gsap.ticker.remove(onTick);
        ScrollTrigger.removeEventListener("refresh", placeTicks);
        header.removeEventListener("focusin", onFocusIn);
      };
    },
    { scope: root },
  );

  return (
    <header
      ref={root}
      className="pointer-events-none invisible fixed inset-x-0 top-0 z-40 opacity-0 noscript:visible noscript:opacity-100"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-px bg-rule">
        <div data-progress className="absolute inset-0 origin-left scale-x-0 bg-plasma" />
        {CHAPTERS.map((chapter) => (
          <span key={chapter.id} data-tick className="absolute top-0 h-2 w-px bg-rule-strong" />
        ))}
      </div>

      <div ref={bar} className="grid-page relative isolate h-16 items-center will-change-transform md:h-20">
        <div className="col-span-full flex items-center justify-between gap-4 md:grid md:grid-cols-3">
          <a
            href={`#${CHAPTERS[0].id}`}
            aria-label={`${SITE.name}, back to the start`}
            onClick={(event) => scrollToAnchor(event, CHAPTERS[0].id)}
            className="pointer-events-auto flex h-11 items-center gap-2 justify-self-start text-bone"
          >
            <SkeinMark className="size-6 text-plasma" />
            <span className="font-display text-2xl leading-none font-light tracking-title italic">{SITE.name}</span>
          </a>
          <ChapterNav />
          <div className="flex justify-end md:justify-self-end">
            <SoundToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
