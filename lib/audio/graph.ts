import { createBed, type Bed } from "@/lib/audio/bed";
import { createNodeBag } from "@/lib/audio/nodes";
import { createImpulseResponse, createNoiseBuffer } from "@/lib/audio/noise";
import { createVoices, type Voices } from "@/lib/audio/voices";

/** Undoes the make-up gain the compressor adds and leaves headroom below full scale. */
const OUTPUT_TRIM = 0.5;

export type SoundGraph = {
  /** Starts at zero; the engine fades it. */
  master: GainNode;
  bed: Bed;
  voices: Voices;
  dispose: () => void;
};

/** bed + voices -> mix (+ reverb return) -> master fade -> limiter -> trim -> destination. */
export function createSoundGraph(context: BaseAudioContext): SoundGraph {
  const bag = createNodeBag(context);
  const noise = createNoiseBuffer(context, 5);

  const trim = bag.gain(OUTPUT_TRIM);
  trim.connect(context.destination);

  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 8;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  limiter.connect(trim);

  const master = bag.gain(0);
  master.connect(limiter);

  const mix = bag.gain(1);
  mix.connect(master);

  const reverb = context.createConvolver();
  reverb.buffer = createImpulseResponse(context, 3.2, 0.6);
  const reverbSend = bag.gain(1);
  const reverbReturn = bag.gain(0.5);
  reverbSend.connect(reverb).connect(reverbReturn).connect(mix);

  const bed = createBed(context, noise, mix, reverbSend);
  const voices = createVoices(context, noise, mix, reverbSend);

  return {
    master,
    bed,
    voices,
    dispose() {
      voices.dispose();
      bed.dispose();
      reverb.disconnect();
      limiter.disconnect();
      bag.dispose();
    },
  };
}
