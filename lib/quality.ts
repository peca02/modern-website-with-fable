export type QualityTier = "ultra" | "high" | "medium" | "low";

export type QualitySettings = {
  /** Side of the square GPGPU state texture; particle count is its square. */
  particleTextureSize: number;
  dprCap: number;
  surfaceSegments: [toroidal: number, poloidal: number];
  shellCount: number;
  coilSegments: number;
  noiseOctaves: number;
  bloom: boolean;
  chromaticAberration: boolean;
  grain: boolean;
};

export const QUALITY_ORDER: readonly QualityTier[] = ["low", "medium", "high", "ultra"];

export const QUALITY: Record<QualityTier, QualitySettings> = {
  ultra: {
    particleTextureSize: 768,
    dprCap: 2,
    surfaceSegments: [480, 48],
    shellCount: 4,
    coilSegments: 96,
    noiseOctaves: 4,
    bloom: true,
    chromaticAberration: true,
    grain: true,
  },
  high: {
    particleTextureSize: 512,
    dprCap: 1.75,
    surfaceSegments: [400, 40],
    shellCount: 3,
    coilSegments: 80,
    noiseOctaves: 4,
    bloom: true,
    chromaticAberration: true,
    grain: true,
  },
  medium: {
    particleTextureSize: 384,
    dprCap: 1.5,
    surfaceSegments: [300, 32],
    shellCount: 2,
    coilSegments: 64,
    noiseOctaves: 3,
    bloom: true,
    chromaticAberration: false,
    grain: true,
  },
  low: {
    particleTextureSize: 256,
    dprCap: 1.25,
    surfaceSegments: [220, 24],
    shellCount: 2,
    coilSegments: 48,
    noiseOctaves: 2,
    bloom: false,
    chromaticAberration: false,
    grain: false,
  },
};

type DeviceSignals = {
  renderer: string;
  maxTextureSize: number;
  coarsePointer: boolean;
  cores: number;
  memoryGb: number | undefined;
  viewportWidth: number;
};

const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|software|basic render/i;
const STRONG_GPUS = /rtx|radeon rx|apple m\d|apple gpu|geforce gtx 1[0-9]{3}|arc a\d/i;
const WEAK_GPUS = /mali-(4|t)|adreno \(tm\) [1-5]\d\d|powervr|intel(\(r\))? (hd|uhd) graphics/i;

export function pickInitialTier(signals: DeviceSignals): QualityTier {
  if (SOFTWARE_RENDERERS.test(signals.renderer) || signals.maxTextureSize < 4096) return "low";
  if (signals.coarsePointer) {
    const strongPhone = signals.cores >= 6 && (signals.memoryGb ?? 4) >= 6 && !WEAK_GPUS.test(signals.renderer);
    return strongPhone ? "medium" : "low";
  }
  if (WEAK_GPUS.test(signals.renderer) || signals.cores <= 4) return "medium";
  if (STRONG_GPUS.test(signals.renderer) && signals.cores >= 8 && signals.viewportWidth >= 1280) return "ultra";
  return "high";
}

export function lowerTier(tier: QualityTier): QualityTier {
  const index = QUALITY_ORDER.indexOf(tier);
  return QUALITY_ORDER[Math.max(0, index - 1)];
}
