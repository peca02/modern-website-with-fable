import { useSyncExternalStore } from "react";
import { playUi } from "@/lib/audio/ui";
import { store } from "@/lib/store";

/** The discrete side of the heat model: the only ignition values React renders from. */
export type IgnitionPhase = { stage: number; holding: boolean; ignited: boolean };

const INITIAL: IgnitionPhase = { stage: 0, holding: false, ignited: false };

let phase = INITIAL;
const listeners = new Set<() => void>();

export function subscribePhase(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPhase(): IgnitionPhase {
  return phase;
}

function getServerPhase(): IgnitionPhase {
  return INITIAL;
}

export function setPhase(patch: Partial<IgnitionPhase>): void {
  const next = { ...phase, ...patch };
  if (next.stage === phase.stage && next.holding === phase.holding && next.ignited === phase.ignited) return;
  phase = next;
  listeners.forEach((listener) => listener());
}

export function usePhase(): IgnitionPhase {
  return useSyncExternalStore(subscribePhase, getPhase, getServerPhase);
}

export function beginHold(): void {
  if (store.heat.holding) return;
  store.heat.holding = true;
  setPhase({ holding: true });
  playUi("press");
}

export function endHold(): void {
  if (!store.heat.holding) return;
  store.heat.holding = false;
  setPhase({ holding: false });
}
