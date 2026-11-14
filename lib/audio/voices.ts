import { createNodeBag } from "@/lib/audio/nodes";
import type { UiSound } from "@/lib/audio/ui";

const HOVER_INTERVAL_MS = 80;
/** A major with an added ninth, spread over two and a half octaves from A3. */
const BLOOM_CHORD = [220, 329.63, 440, 554.37, 659.26, 880, 987.77] as const;

type Tone = {
  type: OscillatorType;
  from: number;
  /** Pitch the tone sweeps to; omit for a steady pitch. */
  to?: number;
  sweep?: number;
  peak: number;
  attack: number;
  /** Time constant of the exponential decay, in seconds. */
  decay: number;
  delay?: number;
  detune?: number;
  /** Share of the tone that also goes to the reverb. */
  wet?: number;
};

export type Voices = {
  play: (sound: Exclude<UiSound, "ignite">) => void;
  bloom: () => void;
  dispose: () => void;
};

/** Short one-shot sounds. Every voice stops itself and disconnects when it ends. */
export function createVoices(
  context: BaseAudioContext,
  noiseBuffer: AudioBuffer,
  out: AudioNode,
  send: AudioNode,
): Voices {
  const active = new Set<() => void>();
  let lastHover = -Infinity;

  /** Runs `build` with a private node bag that is released when its sources have ended. */
  function oneShot(duration: number, build: (bag: ReturnType<typeof createNodeBag>, at: number) => void): void {
    const bag = createNodeBag(context);
    const at = context.currentTime + 0.005;
    const timer = context.createConstantSource();
    const release = (): void => {
      timer.onended = null;
      timer.disconnect();
      bag.dispose();
      active.delete(release);
    };
    active.add(release);
    build(bag, at);
    bag.stop(at + duration);
    // A silent source that outlives the voice by a moment is the clock that frees it.
    timer.offset.value = 0;
    timer.onended = release;
    timer.start(at);
    timer.stop(at + duration + 0.05);
  }

  function addTone(bag: ReturnType<typeof createNodeBag>, at: number, tone: Tone): void {
    const start = at + (tone.delay ?? 0);
    const oscillator = bag.oscillator(tone.type, tone.from, start);
    if (tone.detune) oscillator.detune.value = tone.detune;
    if (tone.to) {
      oscillator.frequency.setValueAtTime(tone.from, start);
      oscillator.frequency.exponentialRampToValueAtTime(tone.to, start + (tone.sweep ?? tone.decay));
    }
    // The envelope gain starts at zero and only ever ramps, so nothing can click.
    const envelope = bag.gain(0);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(tone.peak, start + tone.attack);
    envelope.gain.setTargetAtTime(0, start + tone.attack, tone.decay);
    oscillator.connect(envelope).connect(out);
    if (tone.wet) {
      const wet = bag.gain(tone.wet);
      envelope.connect(wet).connect(send);
    }
  }

  /** Length after which a tone has decayed by about 60 dB. */
  function tail(tone: Tone): number {
    return (tone.delay ?? 0) + tone.attack + tone.decay * 7;
  }

  function playTones(tones: readonly Tone[]): void {
    const duration = Math.max(...tones.map(tail));
    oneShot(duration, (bag, at) => {
      for (const tone of tones) addTone(bag, at, tone);
    });
  }

  function play(sound: Exclude<UiSound, "ignite">): void {
    switch (sound) {
      case "hover": {
        const now = performance.now();
        if (now - lastHover < HOVER_INTERVAL_MS) return;
        lastHover = now;
        playTones([{ type: "sine", from: 2300, to: 1700, peak: 0.012, attack: 0.004, decay: 0.012 }]);
        return;
      }
      case "press":
        playTones([
          { type: "sine", from: 120, to: 52, sweep: 0.12, peak: 0.13, attack: 0.006, decay: 0.05 },
        ]);
        return;
      case "tick":
        playTones([
          { type: "triangle", from: 1320, peak: 0.028, attack: 0.003, decay: 0.03, wet: 0.3 },
        ]);
        return;
      case "confirm":
        // A rising fourth that lands on the drone's root.
        playTones([
          { type: "sine", from: 329.63, peak: 0.05, attack: 0.012, decay: 0.16, wet: 0.6 },
          { type: "triangle", from: 659.26, peak: 0.008, attack: 0.012, decay: 0.1, wet: 0.6 },
          { type: "sine", from: 440, peak: 0.055, attack: 0.012, decay: 0.3, delay: 0.12, wet: 0.8 },
          { type: "triangle", from: 880, peak: 0.008, attack: 0.012, decay: 0.2, delay: 0.12, wet: 0.8 },
        ]);
        return;
    }
  }

  function bloom(): void {
    const tones: Tone[] = [
      { type: "sine", from: 84, to: 36, sweep: 0.6, peak: 0.3, attack: 0.012, decay: 0.32, wet: 0.2 },
    ];
    BLOOM_CHORD.forEach((frequency, index) => {
      // Upper notes are quieter and enter later, so the chord opens upwards like a flare.
      const peak = 0.034 / (1 + index * 0.22);
      const delay = 0.03 + index * 0.045;
      for (const detune of [-5, 5]) {
        tones.push({
          type: "sine",
          from: frequency,
          detune: detune * (1 + index * 0.25),
          peak,
          attack: 0.08 + index * 0.03,
          decay: 0.95,
          delay,
          wet: 1,
        });
      }
    });

    oneShot(Math.max(...tones.map(tail)), (bag, at) => {
      for (const tone of tones) addTone(bag, at, tone);

      const thump = bag.noise(noiseBuffer, Math.random() * noiseBuffer.duration, at);
      const thumpGain = bag.gain(0);
      thumpGain.gain.setValueAtTime(0, at);
      thumpGain.gain.linearRampToValueAtTime(0.09, at + 0.01);
      thumpGain.gain.setTargetAtTime(0, at + 0.01, 0.09);
      thump.connect(bag.filter("lowpass", 240, 0.5)).connect(thumpGain).connect(out);

      const sparkle = bag.noise(noiseBuffer, Math.random() * noiseBuffer.duration, at);
      const sparkleGain = bag.gain(0);
      sparkleGain.gain.setValueAtTime(0, at);
      sparkleGain.gain.linearRampToValueAtTime(0.02, at + 0.35);
      sparkleGain.gain.setTargetAtTime(0, at + 0.35, 0.8);
      sparkle.connect(bag.filter("highpass", 5200, 0.5)).connect(sparkleGain).connect(send);
    });
  }

  return {
    play,
    bloom,
    dispose() {
      for (const release of [...active]) release();
    },
  };
}
