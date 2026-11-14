"use client";

import { useRef, useSyncExternalStore } from "react";
import { setSoundEnabled } from "@/lib/audio/engine";
import { playUi } from "@/lib/audio/ui";
import { MEDIA, gsap, useGSAP } from "@/lib/gsap";
import { on, store } from "@/lib/store";

type SoundState = "on" | "off" | "paused";

const STORAGE_KEY = "skein:sound";
const BAR_REST = [0.35, 0.7, 0.5, 0.25] as const;

function remembered(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function remember(enabled: boolean): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage can be blocked; the toggle still works for this page view.
  }
}

const subscribe = (listener: () => void) => on("sound", listener);
// "paused": the visitor chose sound earlier this session, but audio may not start without a new gesture.
const getSnapshot = (): SoundState => (store.sound.enabled ? "on" : remembered() ? "paused" : "off");
const getServerSnapshot = (): SoundState => "off";

export function SoundToggle() {
  const ref = useRef<HTMLButtonElement>(null);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const enabled = state === "on";

  useGSAP(
    () => {
      const bars = gsap.utils.toArray<HTMLElement>("[data-bar]", ref.current);
      gsap.set(bars, { scaleY: (index: number) => BAR_REST[index] });
      if (!enabled) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.to(bars, {
          scaleY: 1,
          duration: (index: number) => 0.36 + index * 0.11,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: { each: 0.08, from: "end" },
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [enabled], revertOnUpdate: true },
  );

  const toggle = () => {
    const next = !store.sound.enabled;
    remember(next);
    void setSoundEnabled(next).then(() => playUi("confirm"));
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? "Turn sound off" : "Turn sound on"}
      onClick={toggle}
      className={`type-micro pointer-events-auto flex h-11 min-w-11 items-center justify-end gap-3 transition-colors duration-300 ease-reveal hover:text-bone ${
        enabled ? "text-bone" : "text-ash"
      }`}
    >
      <span aria-hidden="true" className={`flex h-3 items-end gap-1 ${enabled ? "text-plasma" : ""}`}>
        {BAR_REST.map((rest) => (
          <span key={rest} data-bar className="h-3 w-px origin-bottom bg-current" />
        ))}
      </span>
      {state === "paused" ? (
        <>
          <span className="md:hidden">Resume</span>
          <span className="hidden md:inline">Sound paused, tap to resume</span>
        </>
      ) : (
        <span>
          <span className="hidden sm:inline">Sound </span>
          {enabled ? "on" : "off"}
        </span>
      )}
    </button>
  );
}
