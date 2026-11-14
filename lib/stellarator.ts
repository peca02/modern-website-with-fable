/**
 * The Skein flux-surface model, shared by CPU code (coil geometry, label anchors,
 * camera path, static fallback art). shaders/skein.glsl.ts holds the GLSL twin;
 * keep both in sync.
 */
export const SKEIN = {
  majorRadius: 2.2,
  minorRadius: 0.5,
  periods: 5,
  elongation: 0.38,
  axisExcursion: 0.16,
  triangularity: 0.12,
  iota: 0.87,
  iotaShear: 0.16,
} as const;

export type Vec3Tuple = [number, number, number];

/** Point on the flux surface `rho` (1 = plasma edge) at poloidal `theta`, toroidal `phi`. */
export function skeinPoint(rho: number, theta: number, phi: number, out: Vec3Tuple): Vec3Tuple {
  const { majorRadius, minorRadius, periods, elongation, axisExcursion, triangularity } = SKEIN;
  const np = periods * phi;
  const a = minorRadius * rho;
  const shape = minorRadius * Math.min(rho * rho, 1.6) * triangularity;
  const r =
    majorRadius +
    axisExcursion * Math.cos(np) +
    a * (Math.cos(theta) + elongation * Math.cos(theta - np)) +
    shape * Math.cos(2 * theta - np);
  const z =
    -axisExcursion * Math.sin(np) +
    a * (Math.sin(theta) - elongation * Math.sin(theta - np)) +
    shape * Math.sin(2 * theta - np);
  out[0] = r * Math.cos(phi);
  out[1] = z;
  out[2] = r * Math.sin(phi);
  return out;
}

export function skeinIota(rho: number): number {
  return SKEIN.iota + SKEIN.iotaShear * rho * rho;
}
