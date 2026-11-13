import { CHAPTER_COUNT } from "@/lib/site";
import type { QualityTier } from "@/lib/quality";

export const MAX_ANCHORS = 8;

type StoreEvent =
  | "tier"
  | "sound"
  | "scene-ready"
  | "loaded"
  | "ignite"
  | "context-lost"
  | "context-restored"
  | "form-sent";

/**
 * The single shared mutable store. GSAP and DOM listeners write to it, the R3F
 * loop reads it inside useFrame. Nothing here triggers a React render; the few
 * discrete changes React cares about go through `on` / `emit`.
 */
export const store = {
  scroll: {
    /** 0..1 over the whole page. */
    progress: 0,
    /** Pixels per second, signed. */
    velocity: 0,
    /** Chapter index + progress inside that chapter: the scene's master clock. */
    time: 0,
  },
  chapters: new Float32Array(CHAPTER_COUNT),
  /** Progress of scrubbed sequences that are finer than a chapter. */
  pins: { winding: 0, inside: 0, yield: 0 },
  pointer: {
    /** Normalised device coordinates, -1..1, y up. */
    x: 0,
    y: 0,
    down: false,
    /** False until the first real pointer event, so the scene can idle gracefully. */
    active: false,
  },
  viewport: { width: 1, height: 1, aspect: 1 },
  load: {
    /** Real progress reported by loading stages, 0..1. */
    target: 0,
    /** Eased value the preloader and the scene both display. */
    shown: 0,
    done: false,
    /** 0..1 hand-off from the preloader's single thread into the hero. */
    intro: 0,
  },
  heat: { value: 0, holding: false, ignited: false },
  drag: { yaw: 0, pitch: 0, active: false },
  /** Screen-space label anchors written by the scene: x px, y px, visibility 0..1. */
  anchors: new Float32Array(MAX_ANCHORS * 3),
  quality: { tier: "high" as QualityTier },
  sound: { enabled: false },
  motion: { reduced: false },
  scene: { ready: false, lost: false },
};

const listeners = new Map<StoreEvent, Set<() => void>>();

export function on(event: StoreEvent, listener: () => void): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

export function emit(event: StoreEvent): void {
  listeners.get(event)?.forEach((listener) => listener());
}
