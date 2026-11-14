"use client";

import { useRef } from "react";
import { IGNITION } from "@/lib/content";
import { MEDIA, gsap, useGSAP } from "@/lib/gsap";
import { beginHold, endHold, getPhase, subscribePhase, usePhase } from "./phase";

const LABELS = ["idle", "holding", "done"] as const;

/** Press and hold: pointer, touch or Space/Enter. The ring is filled by the stage ticker. */
export function HoldButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const { holding, ignited } = usePhase();
  const state = ignited ? 2 : holding ? 1 : 0;

  useGSAP(
    () => {
      const pulse = ref.current?.querySelector<HTMLElement>("[data-pulse]");
      if (!pulse) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const invite = gsap.fromTo(
          pulse,
          { scale: 1, autoAlpha: 0.6 },
          { scale: 1.4, autoAlpha: 0, duration: 1.8, ease: "power2.out", repeat: -1, repeatDelay: 0.8 },
        );
        const sync = () => {
          const phase = getPhase();
          if (phase.holding || phase.ignited) invite.pause(invite.duration());
          else if (invite.paused()) invite.restart();
        };
        sync();
        return subscribePhase(sync);
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <button
      ref={ref}
      type="button"
      data-cursor="Hold"
      aria-pressed={holding}
      className="group relative grid size-28 cursor-pointer touch-none place-items-center rounded-full select-none [-webkit-touch-callout:none] md:size-36"
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        beginHold();
      }}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onPointerLeave={endHold}
      onLostPointerCapture={endHold}
      onKeyDown={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        if (!event.repeat) beginHold();
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") endHold();
      }}
      onBlur={endHold}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span data-pulse aria-hidden="true" className="invisible absolute inset-0 rounded-full border border-plasma" />
      <span
        aria-hidden="true"
        className={`absolute inset-2 rounded-full bg-void/60 transition duration-300 ease-reveal ${
          state === 0 ? "scale-100" : "scale-90"
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute inset-2 rounded-full transition duration-300 ease-reveal ${
          state === 0 ? "scale-75 bg-plasma/0" : state === 1 ? "scale-100 bg-plasma/25" : "scale-100 bg-glow/15"
        }`}
      />
      <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90 fill-none">
        <circle
          cx="50"
          cy="50"
          r="49"
          vectorEffect="non-scaling-stroke"
          className="stroke-rule-strong stroke-1 transition-colors duration-300 group-hover:stroke-bone"
        />
        <circle
          data-ignition="ring"
          cx="50"
          cy="50"
          r="49"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
          vectorEffect="non-scaling-stroke"
          className={`stroke-2 transition-colors duration-300 ${state === 2 ? "stroke-glow" : "stroke-plasma"}`}
        />
      </svg>
      <span className="type-micro relative grid overflow-hidden text-center">
        {LABELS.map((key, index) => (
          <span
            key={key}
            aria-hidden={index !== state}
            className={`col-start-1 row-start-1 px-4 transition-transform duration-300 ease-reveal motion-reduce:transition-none ${
              index === state ? "translate-y-0" : index < state ? "-translate-y-full" : "translate-y-full"
            }`}
          >
            {IGNITION.button[key]}
          </span>
        ))}
      </span>
    </button>
  );
}
