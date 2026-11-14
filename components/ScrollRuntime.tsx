"use client";

import { MEDIA, ScrollSmoother, ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { reportLoad, tickLoad } from "@/lib/loadClock";
import { store } from "@/lib/store";

/**
 * Mounted before the page content so its effect runs first: the smoother must
 * exist before any chapter creates a ScrollTrigger.
 */
export function ScrollRuntime() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(MEDIA.motion, () => {
      ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.1,
        smoothTouch: false,
        effects: false,
        ignoreMobileResize: true,
      });
    });

    mm.add(MEDIA.reduced, () => {
      store.motion.reduced = true;
      return () => {
        store.motion.reduced = false;
      };
    });

    const onPointerMove = (event: PointerEvent) => {
      store.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      store.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
      store.pointer.active = true;
    };
    const onPointerDown = (event: PointerEvent) => {
      onPointerMove(event);
      store.pointer.down = true;
    };
    const onPointerUp = () => {
      store.pointer.down = false;
    };
    const onResize = () => {
      store.viewport.width = window.innerWidth;
      store.viewport.height = window.innerHeight;
      store.viewport.aspect = window.innerWidth / window.innerHeight;
    };

    onResize();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    const onTick = (_time: number, deltaMs: number) => {
      tickLoad(Math.min(deltaMs / 1000, 0.1));
    };
    gsap.ticker.add(onTick);

    let cancelled = false;
    document.fonts.ready.then(() => {
      reportLoad("fonts");
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      gsap.ticker.remove(onTick);
      mm.revert();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", onResize);
    };
  });

  return null;
}
