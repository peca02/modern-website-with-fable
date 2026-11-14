import { createNodeBag, glide } from "@/lib/audio/nodes";
import { clamp, damp, lerp, smoothstep } from "@/lib/math";
import { store } from "@/lib/store";

const ROOT_HZ = 55;
const IGNITION = 3;
const VOICE_GAIN = 0.1;
const TAU = Math.PI * 2;

function note(semitones: number): number {
  return ROOT_HZ * 2 ** (semitones / 12);
}

/** The drone is one fixed pool of pitches over A1; chapters only change how loud each one is. */
const POOL: readonly { semitones: number; type: OscillatorType; throbbed: boolean }[] = [
  { semitones: 0, type: "sine", throbbed: true },
  { semitones: 12, type: "triangle", throbbed: true },
  { semitones: 19, type: "sine", throbbed: false },
  { semitones: 24, type: "triangle", throbbed: false },
  { semitones: 26, type: "sine", throbbed: false },
  { semitones: 27, type: "sine", throbbed: false },
  { semitones: 28, type: "sine", throbbed: false },
  { semitones: 31, type: "sine", throbbed: false },
  { semitones: 13, type: "triangle", throbbed: false },
];

type Preset = {
  /** Gains for POOL: A1, A2, E3, A3, B3, C4, C#4, E4, Bb2. */
  voices: readonly number[];
  cutoff: number;
  /** Detune between the two oscillators of a voice, in cents. */
  spread: number;
  /** Amount of slow, irregular pitch drift. */
  wobble: number;
  noise: number;
  noiseHz: number;
  shimmer: number;
  throb: number;
  level: number;
};

const PRESETS: readonly Preset[] = [
  // Thread: an open fifth with a ninth, dark and expectant.
  { voices: [0.5, 0.5, 0.35, 0.2, 0.12, 0, 0, 0.06, 0], cutoff: 700, spread: 5, wobble: 0, noise: 0.1, noiseHz: 700, shimmer: 0.15, throb: 0, level: 0.8 },
  // Tension: minor third plus a minor second rubbing against the root, drifting pitch, more air.
  { voices: [0.55, 0.45, 0.2, 0.15, 0, 0.22, 0, 0, 0.16], cutoff: 950, spread: 22, wobble: 1, noise: 0.45, noiseHz: 1400, shimmer: 0.05, throb: 0.15, level: 0.9 },
  // Winding: cold and sparse, hollow upper partials, high shimmer.
  { voices: [0.25, 0.15, 0.1, 0, 0.1, 0, 0, 0.14, 0], cutoff: 1800, spread: 3, wobble: 0, noise: 0.06, noiseHz: 5000, shimmer: 1, throb: 0, level: 0.6 },
  // Ignition at zero heat: a low ember. Heat adds the rest.
  { voices: [0.4, 0.35, 0.2, 0.1, 0, 0, 0, 0, 0], cutoff: 500, spread: 8, wobble: 0.1, noise: 0.15, noiseHz: 900, shimmer: 0.1, throb: 0.1, level: 0.8 },
  // Inside: the full major chord, rushing wind, a low throb.
  { voices: [0.7, 0.55, 0.4, 0.35, 0.12, 0, 0.2, 0.2, 0], cutoff: 2200, spread: 12, wobble: 0.15, noise: 0.9, noiseHz: 900, shimmer: 0.3, throb: 0.6, level: 1 },
  // Yield: a steady, pure major sonority.
  { voices: [0.35, 0.4, 0.35, 0.3, 0, 0, 0.26, 0.18, 0], cutoff: 1400, spread: 2.5, wobble: 0, noise: 0.04, noiseHz: 1200, shimmer: 0.25, throb: 0, level: 0.8 },
  // Tie-in: one soft warm tone.
  { voices: [0.12, 0.3, 0.04, 0, 0, 0, 0, 0, 0], cutoff: 600, spread: 2, wobble: 0, noise: 0.02, noiseHz: 600, shimmer: 0.05, throb: 0, level: 0.45 },
];

/** Harmonics of A2 that stack up as the plasma heats; together they spell a major chord. */
const HEAT_HARMONICS = [2, 3, 4, 5, 6, 8] as const;
const SHEPARD_OCTAVES = 4;
const SHIMMER_HZ = [note(55), note(60), note(62)] as const;

export type Bed = {
  update: (dt: number) => void;
  dispose: () => void;
};

/**
 * The ambient drone. `update` reads the shared store and glides every parameter,
 * so it can be driven by a low-rate timer without audible steps.
 */
export function createBed(
  context: BaseAudioContext,
  noiseBuffer: AudioBuffer,
  out: AudioNode,
  send: AudioNode,
): Bed {
  const bag = createNodeBag(context);

  const level = bag.gain(0);
  level.connect(out);
  const toReverb = bag.gain(0.35);
  level.connect(toReverb).connect(send);

  const droneFilter = bag.filter("lowpass", 500, 0.5);
  droneFilter.connect(level);

  // A slow oscillator that modulates the gain of the low voices: the throb.
  const throb = bag.gain(1);
  throb.connect(droneFilter);
  const throbDepth = bag.gain(0);
  bag.oscillator("sine", 0.9).connect(throbDepth).connect(throb.gain);

  const voices = POOL.map((spec, index) => {
    const gain = bag.gain(0);
    gain.connect(spec.throbbed ? throb : droneFilter);
    const frequency = note(spec.semitones);
    const upper = bag.oscillator(spec.type, frequency);
    const lower = bag.oscillator(spec.type, frequency);
    const half = bag.gain(0.5);
    upper.connect(half);
    lower.connect(half);
    half.connect(gain);
    return {
      gain,
      upper,
      lower,
      // Incommensurate rates so the voices never breathe or drift in step.
      breathRate: TAU / (13 + index * 2.3),
      breathPhase: index * 1.7,
      driftRate: 2.3 + index * 0.41,
      driftPhase: index * 2.9,
    };
  });

  const harmonics = HEAT_HARMONICS.map((harmonic, index) => {
    const gain = bag.gain(0);
    gain.connect(droneFilter);
    const oscillator = bag.oscillator("sine", ROOT_HZ * 2 * harmonic);
    oscillator.detune.value = (index % 2 === 0 ? 1 : -1) * (3 + index);
    oscillator.connect(gain);
    return gain;
  });

  const shepard = Array.from({ length: SHEPARD_OCTAVES }, () => {
    const gain = bag.gain(0);
    gain.connect(droneFilter);
    const oscillator = bag.oscillator("sine", ROOT_HZ * 2);
    oscillator.connect(gain);
    return { gain, oscillator };
  });

  const holdFilter = bag.filter("lowpass", 2400, 0.5);
  const holdGain = bag.gain(0);
  holdFilter.connect(holdGain).connect(level);
  const holdTone = bag.oscillator("triangle", note(31));
  const holdRub = bag.oscillator("sine", note(32));
  const holdRubGain = bag.gain(0.4);
  holdTone.connect(holdFilter);
  holdRub.connect(holdRubGain).connect(holdFilter);

  const wind = bag.noise(noiseBuffer, 0);
  const windFilter = bag.filter("bandpass", 900, 0.6);
  const windGain = bag.gain(0);
  wind.connect(windFilter).connect(windGain).connect(level);

  // Offset into the same buffer so the whoosh is not a copy of the wind.
  const whoosh = bag.noise(noiseBuffer, noiseBuffer.duration / 2);
  const whooshFilter = bag.filter("bandpass", 450, 0.9);
  const whooshGain = bag.gain(0);
  whoosh.connect(whooshFilter).connect(whooshGain).connect(level);

  const shimmerPan = bag.panner();
  const shimmerOut = bag.gain(1);
  shimmerPan.connect(shimmerOut).connect(level);
  const shimmerToReverb = bag.gain(1.5);
  shimmerOut.connect(shimmerToReverb).connect(send);
  const shimmer = SHIMMER_HZ.map((frequency, index) => {
    const gain = bag.gain(0);
    gain.connect(shimmerPan);
    bag.oscillator("sine", frequency).connect(gain);
    return { gain, rate: TAU / (5.3 + index * 1.9), phase: index * 2.1 };
  });

  let clock = 0;
  let heat = 0;
  let velocity = 0;
  let hold = 0;
  let rise = 0;
  let risePhase = 0;

  function update(dt: number): void {
    const now = context.currentTime;
    clock += dt;

    // Presets sit at chapter centres and hold for half a chapter before blending on.
    const position = clamp(store.scroll.time - 0.5, 0, PRESETS.length - 1);
    const index = Math.min(Math.floor(position), PRESETS.length - 2);
    const blend = smoothstep(0.25, 0.75, position - index);
    const from = PRESETS[index];
    const to = PRESETS[index + 1];
    const ignition = index === IGNITION ? 1 - blend : index + 1 === IGNITION ? blend : 0;

    heat = damp(heat, clamp(store.heat.value) * ignition, 4, dt);
    velocity = damp(velocity, clamp(Math.abs(store.scroll.velocity) / 2800), 1.6, dt);
    const holding = store.heat.holding && !store.heat.ignited && ignition > 0.5;
    hold = damp(hold, holding ? 1 : 0, 2.5, dt);
    const rising = store.heat.ignited ? 0 : ignition * smoothstep(0.02, 0.3, heat);
    rise = damp(rise, rising, 1.5, dt);

    glide(level.gain, lerp(from.level, to.level, blend), now, 0.3);

    const cutoff = lerp(from.cutoff, to.cutoff, blend) * 2 ** (heat * 2.2) * (1 + velocity * 0.5);
    glide(droneFilter.frequency, Math.min(cutoff, 6000), now);
    glide(throbDepth.gain, lerp(from.throb, to.throb, blend) * 0.4 + heat * 0.15, now, 0.3);

    const spread = lerp(from.spread, to.spread, blend);
    const wobble = lerp(from.wobble, to.wobble, blend) * 14;
    const scrollCents = velocity * 14;
    for (let i = 0; i < voices.length; i++) {
      const voice = voices[i];
      let amount = lerp(from.voices[i], to.voices[i], blend);
      if (i === 0) amount += heat * 0.35;
      const breath = 0.82 + 0.18 * Math.sin(clock * voice.breathRate + voice.breathPhase);
      glide(voice.gain.gain, amount * breath * VOICE_GAIN, now, 0.25);

      const drift =
        wobble *
        (Math.sin(clock * voice.driftRate + voice.driftPhase) +
          0.6 * Math.sin(clock * voice.driftRate * 0.37 + voice.driftPhase * 2));
      const offset = spread * (0.5 + 0.1 * i);
      glide(voice.upper.detune, scrollCents + drift + offset, now, 0.2);
      glide(voice.lower.detune, scrollCents + drift - offset, now, 0.2);
    }

    // Each harmonic enters a little later than the one below it, so heat builds a stack.
    for (let i = 0; i < harmonics.length; i++) {
      const start = (i / harmonics.length) * 0.8;
      const amount = smoothstep(start, start + 0.3, heat) / (1 + i * 0.5);
      glide(harmonics[i].gain, amount * 0.016, now, 0.25);
    }

    // Shepard rise: octave-spaced sines climb together while a raised-cosine window over
    // log-frequency fades each one in at the bottom and out at the top, so it never arrives.
    if (rise > 0.001) risePhase = (risePhase + dt * (0.04 + 0.1 * heat)) % 1;
    for (let i = 0; i < shepard.length; i++) {
      const octave = (i + risePhase) % SHEPARD_OCTAVES;
      const window = Math.sin((Math.PI * octave) / SHEPARD_OCTAVES) ** 2;
      glide(shepard[i].oscillator.frequency, ROOT_HZ * 2 * 2 ** octave, now, 0.05);
      glide(shepard[i].gain.gain, window * rise * 0.006, now);
    }

    glide(holdGain.gain, hold * 0.004, now, 0.2);
    const holdHz = note(31) * 2 ** (heat * 0.75 + hold * 0.08);
    glide(holdTone.frequency, holdHz, now, 0.2);
    // A minor second above the tone: the beating is what makes it tense.
    glide(holdRub.frequency, holdHz * 2 ** (1 / 12), now, 0.2);

    const air = lerp(from.noise, to.noise, blend) + heat * 0.25;
    const gust = 1 + 0.25 * Math.sin(clock * 0.8) + 0.12 * Math.sin(clock * 1.9);
    glide(windGain.gain, air * 0.05 * (0.85 + 0.15 * gust), now, 0.3);
    glide(windFilter.frequency, lerp(from.noiseHz, to.noiseHz, blend) * gust, now, 0.3);

    glide(whooshGain.gain, velocity ** 1.5 * 0.1, now, 0.15);
    glide(whooshFilter.frequency, 450 + velocity * 2000, now, 0.15);

    const sparkle =
      (lerp(from.shimmer, to.shimmer, blend) + heat * 0.4 + velocity * 0.2) *
      (1 + 0.2 * clamp(store.pointer.y, -1, 1));
    for (const partial of shimmer) {
      const swell = 0.5 + 0.5 * Math.sin(clock * partial.rate + partial.phase);
      glide(partial.gain.gain, sparkle * swell * 0.004, now, 0.3);
    }
    glide(shimmerPan.pan, clamp(store.pointer.x, -1, 1) * 0.3, now, 0.4);
  }

  return { update, dispose: bag.dispose };
}
