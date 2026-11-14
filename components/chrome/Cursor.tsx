"use client";

import { useRef } from "react";
import { DURATION, EASE, MEDIA, gsap, useGSAP } from "@/lib/gsap";

type CursorState = "default" | "hover" | "label";

const INTERACTIVE = "a, button, input, textarea, select, label, summary, [role='button'], [data-cursor]";

/**
 * An addition to the native cursor, never a replacement: the system pointer and
 * the focus ring stay untouched, so nothing here is needed to operate the page.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(`${MEDIA.finePointer} and ${MEDIA.motion}`, () => {
        const pick = (name: string) => element.querySelector<HTMLElement>(`[data-part="${name}"]`);
        const follower = pick("follower");
        const pointer = pick("pointer");
        const press = pick("press");
        const ring = pick("ring");
        const disc = pick("disc");
        const label = pick("label");
        const dot = pick("dot");
        if (!follower || !pointer || !press || !ring || !disc || !label || !dot) return;

        gsap.set([ring, disc, dot], { xPercent: -50, yPercent: -50 });
        gsap.set(disc, { scale: 0 });

        const ringX = gsap.quickTo(follower, "x", { duration: 0.5, ease: "power3.out" });
        const ringY = gsap.quickTo(follower, "y", { duration: 0.5, ease: "power3.out" });
        const dotX = gsap.quickTo(pointer, "x", { duration: 0.12, ease: "power3.out" });
        const dotY = gsap.quickTo(pointer, "y", { duration: 0.12, ease: "power3.out" });

        const micro = { duration: DURATION.micro, ease: EASE.micro, overwrite: true };
        let visible = false;
        let state: CursorState = "default";
        let text = "";

        const setVisible = (next: boolean) => {
          if (next === visible) return;
          visible = next;
          gsap.to(element, { autoAlpha: next ? 1 : 0, ...micro });
        };

        const setState = (next: CursorState, nextText = "") => {
          if (next === state && nextText === text) return;
          state = next;
          text = nextText;
          if (next === "label") label.textContent = nextText;
          gsap.to(ring, { scale: next === "hover" ? 1.5 : next === "label" ? 2 : 1, autoAlpha: next === "label" ? 0 : 1, ...micro });
          gsap.to(disc, { scale: next === "label" ? 1 : 0, ...micro });
          gsap.to(dot, { scale: next === "default" ? 1 : next === "hover" ? 0.5 : 0, ...micro });
        };

        const onMove = (event: PointerEvent) => {
          if (event.pointerType === "touch") {
            setVisible(false);
            return;
          }
          if (visible) {
            ringX(event.clientX);
            ringY(event.clientY);
            dotX(event.clientX);
            dotY(event.clientY);
          } else {
            ringX(event.clientX, event.clientX);
            ringY(event.clientY, event.clientY);
            dotX(event.clientX, event.clientX);
            dotY(event.clientY, event.clientY);
            setVisible(true);
          }
        };

        const onOver = (event: PointerEvent) => {
          if (event.pointerType === "touch" || !(event.target instanceof Element)) return;
          const hit = event.target.closest<HTMLElement>(INTERACTIVE);
          const word = event.target.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "";
          if (word) setState("label", word);
          else setState(hit ? "hover" : "default");
        };

        const onOut = (event: PointerEvent) => {
          if (event.relatedTarget === null) setVisible(false);
        };
        const onDown = () => gsap.to(press, { scale: 0.8, ...micro });
        const onUp = () => gsap.to(press, { scale: 1, ...micro });

        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerover", onOver, { passive: true });
        document.addEventListener("pointerout", onOut, { passive: true });
        window.addEventListener("pointerdown", onDown, { passive: true });
        window.addEventListener("pointerup", onUp, { passive: true });
        window.addEventListener("pointercancel", onUp, { passive: true });

        return () => {
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerover", onOver);
          document.removeEventListener("pointerout", onOut);
          window.removeEventListener("pointerdown", onDown);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none invisible fixed top-0 left-0 z-50 opacity-0">
      <div data-part="follower" className="absolute top-0 left-0 will-change-transform">
        <div data-part="press">
          <div data-part="ring" className="absolute size-9 rounded-full border border-rule-strong" />
          <div data-part="disc" className="absolute flex size-20 items-center justify-center rounded-full bg-bone">
            <span data-part="label" className="type-micro text-void" />
          </div>
        </div>
      </div>
      <div data-part="pointer" className="absolute top-0 left-0 will-change-transform">
        <div data-part="dot" className="absolute size-1.5 rounded-full bg-bone" />
      </div>
    </div>
  );
}
