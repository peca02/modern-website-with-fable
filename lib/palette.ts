/** Mirrors the color tokens in app/globals.css. Shaders read colors only from here. */
export const PALETTE = {
  void: "#050506",
  soot: "#0e0e10",
  bone: "#ede8df",
  ash: "#8a857c",
  plasma: "#ff5a1f",
  ember: "#a81e06",
  glow: "#ffe9d2",
  cryo: "#9cc4d4",
} as const;

export type PaletteKey = keyof typeof PALETTE;
