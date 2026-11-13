import { clamp } from "@/lib/math";
import { emit, store } from "@/lib/store";

const STAGE_WEIGHT = { chunk: 0.3, context: 0.15, compiled: 0.35, fonts: 0.2 } as const;
type LoadStage = keyof typeof STAGE_WEIGHT;

const reached = new Set<LoadStage>();

/** Loading stages report here; the preloader counter and the scene's first shot follow. */
export function reportLoad(stage: LoadStage): void {
  if (reached.has(stage)) return;
  reached.add(stage);
  let total = 0;
  reached.forEach((key) => {
    total += STAGE_WEIGHT[key];
  });
  store.load.target = clamp(total);
}

/** When WebGL is unavailable the scene stages will never arrive: release them. */
export function skipSceneLoad(): void {
  reportLoad("chunk");
  reportLoad("context");
  reportLoad("compiled");
}

const MAX_RATE = 0.55;
const INTRO_SECONDS = 3.2;

/** Advances the displayed progress and the hand-off into the hero. Single writer of store.load. */
export function tickLoad(dt: number): void {
  const load = store.load;
  if (!load.done) {
    const step = Math.min(load.target - load.shown, MAX_RATE * dt);
    load.shown = clamp(load.shown + Math.max(step, 0));
    if (load.shown >= 0.999) {
      load.shown = 1;
      load.done = true;
      emit("loaded");
    }
    return;
  }
  if (load.intro < 1) {
    load.intro = store.motion.reduced ? 1 : clamp(load.intro + dt / INTRO_SECONDS);
  }
}
