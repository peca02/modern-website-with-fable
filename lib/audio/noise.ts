const LOOP_FADE_SECONDS = 0.25;

/**
 * Stereo pink-ish noise that loops without a seam: the samples that would follow
 * the end of the buffer are cross-faded into its head.
 */
export function createNoiseBuffer(context: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(seconds * context.sampleRate);
  const fade = Math.floor(LOOP_FADE_SECONDS * context.sampleRate);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  const scratch = new Float32Array(length + fade);

  for (let channel = 0; channel < 2; channel++) {
    // Paul Kellet's economy pink filter: three one-pole low-passes summed with the white input.
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let peak = 0;
    for (let i = 0; i < scratch.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      const sample = b0 + b1 + b2 + white * 0.1848;
      scratch[i] = sample;
      peak = Math.max(peak, Math.abs(sample));
    }

    const data = buffer.getChannelData(channel);
    const scale = 0.9 / peak;
    for (let i = 0; i < length; i++) {
      let sample = scratch[i];
      if (i < fade) {
        // Equal-power cross-fade, because the two segments are uncorrelated.
        const t = i / fade;
        sample = sample * Math.sqrt(t) + scratch[length + i] * Math.sqrt(1 - t);
      }
      data[i] = sample * scale;
    }
  }
  return buffer;
}

/**
 * A synthetic hall: exponentially decaying stereo noise that gets darker as it
 * decays, the way air and walls absorb high frequencies first.
 */
export function createImpulseResponse(
  context: BaseAudioContext,
  seconds: number,
  decaySeconds: number,
): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.floor(seconds * rate);
  const preDelay = Math.floor(0.018 * rate);
  const attack = Math.floor(0.006 * rate);
  const release = Math.floor(length * 0.15);
  const buffer = context.createBuffer(2, length, rate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let low = 0;
    for (let i = preDelay; i < length; i++) {
      const n = i - preDelay;
      const t = n / rate;
      // One-pole low-pass whose coefficient shrinks over time: bright onset, dark tail.
      const coefficient = 0.08 + 0.6 * Math.exp(-t * 2.2);
      low += ((Math.random() * 2 - 1) - low) * coefficient;
      const fadeIn = Math.min(1, n / attack);
      const fadeOut = Math.min(1, (length - i) / release);
      data[i] = low * Math.exp(-t / decaySeconds) * fadeIn * fadeOut;
    }
  }
  return buffer;
}
