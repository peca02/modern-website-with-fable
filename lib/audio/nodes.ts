/** Smallest time constant used for live parameter changes: anything faster is heard as stepping. */
export const GLIDE = 0.12;

/** Moves a parameter towards a value without a step, from wherever it currently is. */
export function glide(param: AudioParam, value: number, now: number, timeConstant = GLIDE): void {
  param.setTargetAtTime(value, now, timeConstant);
}

type NodeBag = {
  gain: (value: number) => GainNode;
  oscillator: (type: OscillatorType, frequency: number, startAt?: number) => OscillatorNode;
  filter: (type: BiquadFilterType, frequency: number, q: number) => BiquadFilterNode;
  noise: (buffer: AudioBuffer, offset: number, startAt?: number) => AudioBufferSourceNode;
  panner: () => StereoPannerNode;
  /** Stops every source at the given time; sources that never started are stopped immediately. */
  stop: (at?: number) => void;
  dispose: () => void;
};

/** Creates nodes and remembers them, so a whole sub-graph can be torn down in one call. */
export function createNodeBag(context: BaseAudioContext): NodeBag {
  const nodes: AudioNode[] = [];
  const sources: AudioScheduledSourceNode[] = [];
  let disposed = false;

  function keep<T extends AudioNode>(node: T): T {
    nodes.push(node);
    return node;
  }

  function stop(at?: number): void {
    for (const source of sources) {
      try {
        source.stop(at);
      } catch {
        // Already stopped: nothing left to do for this source.
      }
    }
  }

  return {
    gain(value) {
      const node = keep(context.createGain());
      node.gain.value = value;
      return node;
    },
    oscillator(type, frequency, startAt) {
      const node = keep(context.createOscillator());
      node.type = type;
      node.frequency.value = frequency;
      node.start(startAt);
      sources.push(node);
      return node;
    },
    filter(type, frequency, q) {
      const node = keep(context.createBiquadFilter());
      node.type = type;
      node.frequency.value = frequency;
      node.Q.value = q;
      return node;
    },
    noise(buffer, offset, startAt) {
      const node = keep(context.createBufferSource());
      node.buffer = buffer;
      node.loop = true;
      node.start(startAt, offset % buffer.duration);
      sources.push(node);
      return node;
    },
    panner() {
      return keep(context.createStereoPanner());
    },
    stop,
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      for (const node of nodes) node.disconnect();
      nodes.length = 0;
      sources.length = 0;
    },
  };
}
