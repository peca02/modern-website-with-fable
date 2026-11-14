"use client";

import { useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, PointerEvent } from "react";
import { PiCaretDownLight } from "react-icons/pi";
import { scrollToAnchor } from "@/components/chrome/scrollToAnchor";
import { playUi } from "@/lib/audio/ui";
import { DURATION, EASE, MEDIA, STAGGER, gsap, useGSAP } from "@/lib/gsap";
import { CHAPTERS, CHAPTER_COUNT } from "@/lib/site";
import { store } from "@/lib/store";

const LIST_ID = "chapter-list";
const CLOSE_SPEED = 2.5;
const HOVER_CLOSE_DELAY = 0.25;
// The smoother settles a hair short of a section top; without this the previous chapter stays active.
const TIME_EPSILON = 0.01;

export function ChapterNav() {
  const nav = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(false);
  /** True once a click or key press opened the list: hover-out no longer closes it. */
  const pinned = useRef(false);
  const hoverClose = useRef<gsap.core.Tween | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const close = () => {
    hoverClose.current?.kill();
    pinned.current = false;
    setOpen(false);
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MEDIA.motion, reduced: MEDIA.reduced }, (context) => {
        const reduced = Boolean(context.conditions?.reduced);
        const tl = gsap.timeline({ paused: true });
        tl.to("[data-panel]", { autoAlpha: 1, duration: reduced ? 0.01 : DURATION.micro, ease: EASE.micro });
        if (!reduced) {
          tl.from(
            "[data-link-label]",
            { yPercent: 110, duration: DURATION.move, ease: EASE.reveal, stagger: STAGGER.items },
            0,
          );
        }
        if (openRef.current) tl.progress(1);
        timeline.current = tl;
        return () => {
          timeline.current = null;
        };
      });

      let current = 0;
      const onTick = () => {
        const next = gsap.utils.clamp(0, CHAPTER_COUNT - 1, Math.floor(store.scroll.time + TIME_EPSILON));
        if (next === current) return;
        current = next;
        setActive(next);
      };
      gsap.ticker.add(onTick);

      return () => {
        gsap.ticker.remove(onTick);
        mm.revert();
      };
    },
    { scope: nav },
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.from("[data-current]", { yPercent: 110, duration: DURATION.move, ease: EASE.reveal });
      });
      return () => mm.revert();
    },
    { scope: nav, dependencies: [active], revertOnUpdate: true },
  );

  useEffect(() => {
    openRef.current = open;
    const tl = timeline.current;
    if (tl) {
      if (open) tl.timeScale(1).play();
      else tl.timeScale(CLOSE_SPEED).reverse();
    }
    if (!open) return;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !nav.current?.contains(event.target)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(
    () => () => {
      hoverClose.current?.kill();
    },
    [],
  );

  const onButtonClick = () => {
    playUi("press");
    hoverClose.current?.kill();
    if (open && !pinned.current) {
      pinned.current = true;
      return;
    }
    pinned.current = !open;
    setOpen(!open);
  };

  const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    hoverClose.current?.kill();
    setOpen(true);
  };

  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || pinned.current) return;
    hoverClose.current?.kill();
    hoverClose.current = gsap.delayedCall(HOVER_CLOSE_DELAY, () => setOpen(false));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !open) return;
    event.stopPropagation();
    close();
    button.current?.focus();
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!open || !(event.relatedTarget instanceof Node)) return;
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  };

  const current = CHAPTERS[active];

  return (
    <nav
      ref={nav}
      aria-label="Chapters"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className="md:justify-self-center"
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={LIST_ID}
        onClick={onButtonClick}
        className="type-micro pointer-events-auto flex h-11 items-center gap-3 text-bone"
      >
        <span className="sr-only">Chapters. Current chapter: </span>
        <span className="text-plasma">{current.index}</span>
        <span aria-hidden="true" className="h-px w-6 bg-rule-strong" />
        <span className="overflow-clip">
          <span data-current className="block">
            {current.label}
          </span>
        </span>
        <PiCaretDownLight
          aria-hidden="true"
          className={`size-3 transition-transform duration-300 ease-reveal ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        data-panel
        className="pointer-events-auto invisible absolute inset-x-0 top-0 -z-10 border-b border-rule bg-void/95 pt-16 opacity-0 md:pt-20"
      >
        <ul
          id={LIST_ID}
          className="grid-page pt-4 pb-8 md:flex md:flex-wrap md:items-baseline md:gap-x-12 md:gap-y-4 md:pt-8 md:pb-12 lg:gap-x-16"
        >
          {CHAPTERS.map((chapter, index) => {
            const isActive = index === active;
            return (
              <li key={chapter.id} className="col-span-full border-t border-rule md:border-t-0">
                <a
                  href={`#${chapter.id}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={(event) => {
                    playUi("press");
                    scrollToAnchor(event, chapter.id);
                    close();
                  }}
                  className={`group flex min-h-11 items-baseline gap-4 py-3 transition-colors duration-300 ease-reveal hover:text-bone md:gap-3 md:py-0 ${
                    isActive ? "text-bone" : "text-ash"
                  }`}
                >
                  <span className={`type-micro w-6 md:w-auto ${isActive ? "text-plasma" : ""}`}>{chapter.index}</span>
                  <span className="type-title -mb-[0.25em] overflow-clip pb-[0.25em]">
                    <span data-link-label className={`block ${isActive ? "italic" : ""}`}>
                      {chapter.label}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
