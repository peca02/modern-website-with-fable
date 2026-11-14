"use client";

import { useRef } from "react";
import { playUi } from "@/lib/audio/ui";
import { IGNITION } from "@/lib/content";
import { MEDIA, gsap, useGSAP } from "@/lib/gsap";
import { clamp, smoothstep } from "@/lib/math";
import { emit, store } from "@/lib/store";
import { DECAY_RATE, SCROLL_HEAT, SCROLL_SPAN, readoutShare, riseRate, stageAt, temperatureAt } from "./heat";
import { setPhase } from "./phase";

type IgnitionStageProps = { className?: string; children: React.ReactNode };

const numberFormat = new Intl.NumberFormat("en-US");

/**
 * The pinned stage and the heat model. Runs once per frame on the GSAP ticker, writes
 * `store.heat` for the scene and patches the figures straight into the DOM; React only
 * hears about stage, holding and ignition changes.
 */
export function IgnitionStage({ className, children }: IgnitionStageProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const stage = ref.current;
      if (!stage) return;
      const counter = stage.querySelector<HTMLElement>('[data-ignition="counter"]');
      const fill = stage.querySelector<HTMLElement>('[data-ignition="fill"]');
      const ring = stage.querySelector<SVGCircleElement>('[data-ignition="ring"]');
      const readouts = gsap.utils.toArray<HTMLElement>('[data-ignition="readout"]', stage);
      const setFill = fill ? gsap.quickSetter(fill, "scaleX") : undefined;
      const setReadoutAlpha = gsap.quickSetter(readouts, "opacity");

      const scroll = { progress: 0 };
      let hold = 0;
      let wasHolding = false;
      let ignited = false;
      let lastHeat = -1;
      let lastTemperature = -1;
      let lastShare = -1;
      let lastStageIndex = 0;

      const reset = () => {
        ignited = false;
        hold = 0;
        store.heat.ignited = false;
        setPhase({ ignited: false });
      };

      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        gsap.to(scroll, {
          progress: 1,
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: "+=300%",
            pin: true,
            scrub: true,
            onLeaveBack: reset,
          },
        });
      });

      mm.add(MEDIA.reduced, () => {
        gsap.to(scroll, {
          progress: 0,
          scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom top", onLeaveBack: reset },
        });
      });

      const tick = (_time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs / 1000, 0.1);
        const holding = store.heat.holding;
        const scrollHeat = SCROLL_HEAT * clamp(scroll.progress / SCROLL_SPAN);
        let heat = 1;

        if (!ignited) {
          if (holding) {
            if (!wasHolding) hold = Math.max(hold, scrollHeat);
            hold = Math.min(1, hold + riseRate(hold) * dt);
          } else if (hold > 0) {
            hold = Math.max(0, hold - DECAY_RATE * dt);
          }
          heat = clamp(Math.max(scrollHeat, hold));
          if (heat >= 1) {
            ignited = true;
            store.heat.ignited = true;
            setPhase({ ignited: true });
            emit("ignite");
            playUi("ignite");
          }
        }
        wasHolding = holding;
        store.heat.value = heat;
        if (heat === lastHeat) return;
        lastHeat = heat;

        const temperature = temperatureAt(heat);
        if (counter && temperature !== lastTemperature) {
          lastTemperature = temperature;
          counter.textContent = numberFormat.format(temperature);
        }

        setFill?.(heat);
        if (ring) ring.style.strokeDashoffset = String(1 - heat);

        const share = readoutShare(heat);
        if (share !== lastShare) {
          lastShare = share;
          setReadoutAlpha(0.4 + 0.6 * smoothstep(0, 0.05, share));
          for (let i = 0; i < readouts.length; i++) {
            const readout = IGNITION.readouts[i];
            if (readout) readouts[i].textContent = (readout.peak * share).toFixed(readout.decimals);
          }
        }

        const stageIndex = stageAt(heat);
        if (stageIndex !== lastStageIndex) {
          lastStageIndex = stageIndex;
          setPhase({ stage: stageIndex });
          playUi("tick");
        }
      };

      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        mm.revert();
        store.heat.value = 0;
        store.heat.holding = false;
        store.heat.ignited = false;
        setPhase({ stage: 0, holding: false, ignited: false });
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
