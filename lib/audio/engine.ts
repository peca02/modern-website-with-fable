import { emit, store } from "@/lib/store";

/** Turns the synthesized soundscape on or off. Must be called from a user gesture to turn on. */
export async function setSoundEnabled(enabled: boolean): Promise<void> {
  store.sound.enabled = enabled;
  emit("sound");
}
