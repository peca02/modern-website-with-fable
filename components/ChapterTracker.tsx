"use client";

import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { CHAPTERS } from "@/lib/site";
import { store } from "@/lib/store";

/**
 * Mounted after the page content. Its triggers refresh after every pin
 * (negative refreshPriority), so chapter ranges include pin spacing.
 */
export function ChapterTracker() {
  useGSAP(() => {
    const updateTime = () => {
      let time = 0;
      for (let i = 0; i < store.chapters.length; i++) time += store.chapters[i];
      store.scroll.time = time;
    };

    CHAPTERS.forEach((chapter, index) => {
      const isLast = index === CHAPTERS.length - 1;
      ScrollTrigger.create({
        trigger: `[data-chapter="${chapter.id}"]`,
        start: "top top",
        end: isLast ? "max" : "bottom top",
        refreshPriority: -1,
        onUpdate: (self) => {
          store.chapters[index] = self.progress;
          updateTime();
        },
        onRefresh: (self) => {
          store.chapters[index] = self.progress;
          updateTime();
        },
      });
    });

    ScrollTrigger.create({
      start: 0,
      end: "max",
      refreshPriority: -1,
      onUpdate: (self) => {
        store.scroll.progress = self.progress;
        store.scroll.velocity = self.getVelocity();
      },
    });
  });

  return null;
}
