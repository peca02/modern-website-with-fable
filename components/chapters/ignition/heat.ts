import { IGNITION } from "@/lib/content";
import { clamp, remap } from "@/lib/math";

/** Heat reached by scrolling through the whole pin without ever pressing. */
export const SCROLL_HEAT = 0.62;
/** Share of the pin over which scroll heat climbs; the rest is a plateau to read in. */
export const SCROLL_SPAN = 0.85;
const HOLD_SECONDS = 3.2;
const DECAY_SECONDS = 6;
const READOUT_THRESHOLD = IGNITION.stages[3].at;

const ROOM_TEMPERATURE = 20;
const LOG_FLOOR = Math.log(ROOM_TEMPERATURE);
const LOG_RANGE = Math.log(IGNITION.peakTemperature) - LOG_FLOOR;
/**
 * The counter climbs along a saturating curve in log space: orders of magnitude fly by
 * early, the last stretch is a slow, even push. 4.063 puts 10,000 °C on the Breakdown
 * threshold (heat 0.12), matching the stage copy.
 */
const CURVE = 4.063;
const CURVE_NORM = 1 - Math.exp(-CURVE);

export function temperatureAt(heat: number): number {
  if (heat >= 1) return IGNITION.peakTemperature;
  const share = (1 - Math.exp(-CURVE * clamp(heat))) / CURVE_NORM;
  return Math.round(Math.exp(LOG_FLOOR + LOG_RANGE * share));
}

export function stageAt(heat: number): number {
  let index = 0;
  for (let i = 1; i < IGNITION.stages.length; i++) {
    if (heat >= IGNITION.stages[i].at) index = i;
  }
  return index;
}

/** 0 until the neutral beams come on, then an accelerating climb to 1 at ignition. */
export function readoutShare(heat: number): number {
  const share = remap(heat, READOUT_THRESHOLD, 1);
  return share * share;
}

/**
 * Heat gained per second while held. Slightly faster at the bottom and slower near the
 * top so the last degrees feel earned; the constant makes 0 → 1 take HOLD_SECONDS.
 */
export function riseRate(hold: number): number {
  return ((2 * Math.log(1.25 / 0.75)) / HOLD_SECONDS) * (1.25 - 0.5 * hold);
}

export const DECAY_RATE = 1 / DECAY_SECONDS;
