"use client";

import { useEffect, useRef } from "react";
import { PiArrowsHorizontalLight } from "react-icons/pi";
import { DURATION, EASE, MEDIA, ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { store } from "@/lib/store";

const RADIANS_PER_PIXEL = 0.006;
const PITCH_LIMIT = 0.5;
const MAX_SPIN = 9;
const FRICTION = 3.2;
const REST_SPIN = 0.002;
const KEY_IMPULSE = 1.4;
const KEY_STEP = 0.2;
/** A pointer that rested this long before release throws nothing. */
const STALE_RELEASE_MS = 90;
const FULL_TURN = Math.PI * 2;

type StarDragSurfaceProps = {
  label: string;
  hint: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * The empty upper stage of the last chapter. Pointer drags and arrow keys write
 * store.drag; the scene reads it. Nothing here goes through React state.
 */
export function StarDragSurface({ label, hint, className = "", children }: StarDragSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const surface = ref.current;
      if (!surface) return;

      let spinYaw = 0;
      let spinPitch = 0;
      let lastX = 0;
      let lastY = 0;
      let lastTime = 0;
      let pointerId: number | null = null;
      let settle: gsap.core.Tween | undefined;

      const clampPitch = (value: number) => gsap.utils.clamp(-PITCH_LIMIT, PITCH_LIMIT, value);
      const clampSpin = (value: number) => gsap.utils.clamp(-MAX_SPIN, MAX_SPIN, value);

      const settleToRest = () => {
        spinYaw = 0;
        spinPitch = 0;
        // Unwind whole turns first so the star takes the short way home.
        store.drag.yaw = gsap.utils.wrap(-Math.PI, Math.PI, store.drag.yaw % FULL_TURN);
        settle?.kill();
        settle = gsap.to(store.drag, {
          yaw: 0,
          pitch: 0,
          duration: store.motion.reduced ? 0 : DURATION.move,
          ease: EASE.move,
        });
      };

      const release = () => {
        pointerId = null;
        store.drag.active = false;
        delete surface.dataset.dragging;
      };

      const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        settle?.kill();
        pointerId = event.pointerId;
        surface.setPointerCapture(event.pointerId);
        lastX = event.clientX;
        lastY = event.clientY;
        lastTime = event.timeStamp;
        spinYaw = 0;
        spinPitch = 0;
        store.drag.active = true;
        surface.dataset.dragging = "true";
      };

      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        const seconds = Math.max((event.timeStamp - lastTime) / 1000, 0.001);
        const turnYaw = (event.clientX - lastX) * RADIANS_PER_PIXEL;
        // Touch keeps the vertical axis for scrolling the page.
        const turnPitch = event.pointerType === "touch" ? 0 : (event.clientY - lastY) * RADIANS_PER_PIXEL;
        store.drag.yaw += turnYaw;
        store.drag.pitch = clampPitch(store.drag.pitch + turnPitch);
        spinYaw = clampSpin(gsap.utils.interpolate(spinYaw, turnYaw / seconds, 0.5));
        spinPitch = clampSpin(gsap.utils.interpolate(spinPitch, turnPitch / seconds, 0.5));
        lastX = event.clientX;
        lastY = event.clientY;
        lastTime = event.timeStamp;
      };

      const onPointerUp = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        if (store.motion.reduced || event.timeStamp - lastTime > STALE_RELEASE_MS) {
          spinYaw = 0;
          spinPitch = 0;
        }
        release();
      };

      const onKeyDown = (event: KeyboardEvent) => {
        const yawSign = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        const pitchSign = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
        if (yawSign === 0 && pitchSign === 0) return;
        event.preventDefault();
        settle?.kill();
        if (store.motion.reduced) {
          store.drag.yaw += yawSign * KEY_STEP;
          store.drag.pitch = clampPitch(store.drag.pitch + pitchSign * KEY_STEP);
          return;
        }
        spinYaw = clampSpin(spinYaw + yawSign * KEY_IMPULSE);
        spinPitch = clampSpin(spinPitch + pitchSign * KEY_IMPULSE);
      };

      const onTick = (_time: number, deltaMs: number) => {
        if (store.drag.active || (spinYaw === 0 && spinPitch === 0)) return;
        const seconds = Math.min(deltaMs / 1000, 0.05);
        store.drag.yaw += spinYaw * seconds;
        const pitch = store.drag.pitch + spinPitch * seconds;
        store.drag.pitch = clampPitch(pitch);
        if (store.drag.pitch !== pitch) spinPitch = 0;
        const decay = Math.exp(-FRICTION * seconds);
        spinYaw *= decay;
        spinPitch *= decay;
        if (Math.abs(spinYaw) < REST_SPIN) spinYaw = 0;
        if (Math.abs(spinPitch) < REST_SPIN) spinPitch = 0;
      };

      surface.addEventListener("pointerdown", onPointerDown);
      surface.addEventListener("pointermove", onPointerMove);
      surface.addEventListener("pointerup", onPointerUp);
      surface.addEventListener("pointercancel", onPointerUp);
      surface.addEventListener("keydown", onKeyDown);
      gsap.ticker.add(onTick);

      let hintLoop: gsap.core.Tween | undefined;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        hintLoop = gsap.fromTo(
          "[data-hint-bead]",
          { x: 0 },
          { x: 40, duration: DURATION.move * 2, ease: EASE.move, repeat: -1, yoyo: true, paused: true },
        );
        return () => {
          hintLoop = undefined;
        };
      });

      const trigger = ScrollTrigger.create({
        trigger: surface,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => hintLoop?.paused(!self.isActive),
        onLeaveBack: settleToRest,
      });
      hintLoop?.paused(!trigger.isActive);

      return () => {
        surface.removeEventListener("pointerdown", onPointerDown);
        surface.removeEventListener("pointermove", onPointerMove);
        surface.removeEventListener("pointerup", onPointerUp);
        surface.removeEventListener("pointercancel", onPointerUp);
        surface.removeEventListener("keydown", onKeyDown);
        gsap.ticker.remove(onTick);
        settle?.kill();
        release();
        mm.revert();
      };
    },
    { scope: ref },
  );

  useEffect(
    () => () => {
      // Created outside the GSAP context on purpose: it has to outlive this component.
      gsap.to(store.drag, { yaw: 0, pitch: 0, duration: DURATION.move, ease: EASE.move });
    },
    [],
  );

  return (
    <div
      ref={ref}
      role="group"
      tabIndex={0}
      aria-label={label}
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
      data-cursor="Drag"
      className={`relative cursor-grab touch-pan-y select-none focus-visible:-outline-offset-4 data-[dragging=true]:cursor-grabbing ${className}`}
    >
      {children}
      <p className="type-micro pointer-events-none absolute inset-x-5 bottom-8 flex items-center gap-4 text-ash md:inset-x-10 lg:justify-end 2xl:inset-x-16">
        <PiArrowsHorizontalLight aria-hidden="true" className="size-4 text-plasma" />
        <span>{hint}</span>
        <span aria-hidden="true" className="relative h-px w-12 bg-rule-strong">
          <span data-hint-bead className="absolute left-0 top-0 h-px w-2 bg-plasma" />
        </span>
      </p>
    </div>
  );
}
