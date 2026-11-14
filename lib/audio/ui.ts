export type UiSound = "hover" | "press" | "tick" | "confirm" | "ignite";

type UiSoundPlayer = (sound: UiSound) => void;

let player: UiSoundPlayer | null = null;

/** The audio engine registers itself here once the visitor turns sound on. */
export function setUiSoundPlayer(next: UiSoundPlayer | null): void {
  player = next;
}

/** Safe to call from anywhere: silent until sound is enabled. */
export function playUi(sound: UiSound): void {
  player?.(sound);
}
