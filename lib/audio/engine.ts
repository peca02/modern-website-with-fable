import { createSoundGraph, type SoundGraph } from "@/lib/audio/graph";
import { setUiSoundPlayer, type UiSound } from "@/lib/audio/ui";
import { emit, on, store } from "@/lib/store";

const FADE_IN = 0.4;
const FADE_OUT = 0.12;
const SUSPEND_DELAY_MS = 600;
const UPDATE_INTERVAL_MS = 33;
const BLOOM_GUARD_MS = 1000;

type Runtime = { context: AudioContext; graph: SoundGraph };

let runtime: Runtime | null = null;
/** What the visitor asked for; the context may still be asleep (hidden tab, interruption). */
let wanted = false;
let loop: number | null = null;
let suspendTimer: number | null = null;
let lastTick = 0;
let lastBloom = -Infinity;
let offIgnite: (() => void) | null = null;
let retryArmed = false;

function setStoreFlag(enabled: boolean): void {
  if (store.sound.enabled === enabled) return;
  store.sound.enabled = enabled;
  emit("sound");
}

function clearSuspend(): void {
  if (suspendTimer === null) return;
  window.clearTimeout(suspendTimer);
  suspendTimer = null;
}

function stopLoop(): void {
  if (loop === null) return;
  window.clearInterval(loop);
  loop = null;
}

function tick(): void {
  if (!runtime) return;
  const now = performance.now();
  const dt = Math.min((now - lastTick) / 1000, 0.1);
  lastTick = now;
  runtime.graph.bed.update(dt);
}

function bloom(): void {
  if (!runtime || runtime.context.state !== "running") return;
  const now = performance.now();
  if (now - lastBloom < BLOOM_GUARD_MS) return;
  lastBloom = now;
  runtime.graph.voices.bloom();
}

function playSound(sound: UiSound): void {
  // A sleeping context would queue the voice and play it late, on resume.
  if (!runtime || runtime.context.state !== "running") return;
  if (sound === "ignite") bloom();
  else runtime.graph.voices.play(sound);
}

function activate(): void {
  if (!runtime) return;
  clearSuspend();
  const { context, graph } = runtime;
  graph.master.gain.setTargetAtTime(1, context.currentTime, FADE_IN);
  if (loop === null) {
    lastTick = performance.now();
    tick();
    loop = window.setInterval(tick, UPDATE_INTERVAL_MS);
  }
  setUiSoundPlayer(playSound);
  offIgnite ??= on("ignite", bloom);
}

/** Fades out, then suspends the context once the fade is inaudible. */
function rest(): void {
  if (!runtime) return;
  stopLoop();
  clearSuspend();
  const { context, graph } = runtime;
  graph.master.gain.setTargetAtTime(0, context.currentTime, FADE_OUT);
  suspendTimer = window.setTimeout(() => {
    suspendTimer = null;
    context.suspend().catch(() => undefined);
  }, SUSPEND_DELAY_MS);
}

async function resume(context: AudioContext): Promise<boolean> {
  try {
    await context.resume();
  } catch {
    return false;
  }
  return context.state === "running";
}

function disarmRetry(): void {
  if (!retryArmed) return;
  retryArmed = false;
  window.removeEventListener("pointerdown", handleRetry);
  window.removeEventListener("keydown", handleRetry);
}

/** Some browsers refuse to resume without a fresh gesture after an interruption. */
function armRetry(): void {
  if (retryArmed) return;
  retryArmed = true;
  window.addEventListener("pointerdown", handleRetry);
  window.addEventListener("keydown", handleRetry);
}

function handleRetry(): void {
  disarmRetry();
  void wake();
}

async function wake(): Promise<void> {
  if (!runtime || !wanted) return;
  clearSuspend();
  const running = await resume(runtime.context);
  if (!runtime || !wanted || document.hidden) return;
  if (running) activate();
  else armRetry();
}

function handleVisibility(): void {
  if (!runtime || !wanted) return;
  if (document.hidden) rest();
  else void wake();
}

function handleStateChange(): void {
  if (!runtime || !wanted || document.hidden) return;
  if (runtime.context.state === "running") {
    disarmRetry();
    activate();
  } else {
    // Suspended or interrupted from outside (a call, another app taking the audio session).
    stopLoop();
    armRetry();
  }
}

function ensureRuntime(): Runtime | null {
  if (runtime) return runtime;
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;
  let context: AudioContext;
  try {
    context = new AudioContext();
  } catch {
    return null;
  }
  runtime = { context, graph: createSoundGraph(context) };
  context.addEventListener("statechange", handleStateChange);
  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", disposeSound);
  return runtime;
}

/** Turns the synthesized soundscape on or off. Must be called from a user gesture to turn on. */
export async function setSoundEnabled(enabled: boolean): Promise<void> {
  if (!enabled) {
    wanted = false;
    disarmRetry();
    setUiSoundPlayer(null);
    setStoreFlag(false);
    rest();
    return;
  }

  // The context is created synchronously, while the click still counts as a user gesture.
  const current = ensureRuntime();
  if (!current) return;
  wanted = true;
  clearSuspend();
  const running = await resume(current.context);
  // A later call may have turned sound off again, or torn everything down, while this one waited.
  if (!wanted || runtime !== current) return;
  if (!running) {
    wanted = false;
    return;
  }
  setStoreFlag(true);
  activate();
}

/** Tears the whole engine down. The next `setSoundEnabled(true)` builds a fresh one. */
export function disposeSound(): void {
  wanted = false;
  stopLoop();
  clearSuspend();
  disarmRetry();
  setUiSoundPlayer(null);
  offIgnite?.();
  offIgnite = null;
  if (runtime) {
    const { context, graph } = runtime;
    runtime = null;
    context.removeEventListener("statechange", handleStateChange);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", disposeSound);
    graph.dispose();
    context.close().catch(() => undefined);
  }
  setStoreFlag(false);
}
