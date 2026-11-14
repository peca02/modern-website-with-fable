export const LAYER_COUNT = 6;

export function layerIndexLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** Coils and cryostat are the cold side of the machine: the only places the spec turns cryo. */
export function layerSpecTone(index: number): string {
  return index >= 4 ? "text-cryo" : "text-plasma";
}

/** Outside-in reveal: cryostat (5) at progress 0, plasma (0) at progress 1. */
export function activeLayer(progress: number): number {
  return Math.min(LAYER_COUNT - 1, Math.max(0, LAYER_COUNT - 1 - Math.floor(progress * LAYER_COUNT)));
}
