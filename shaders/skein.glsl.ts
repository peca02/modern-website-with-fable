import { SKEIN } from "@/lib/stellarator";

const f = (value: number) => value.toFixed(5);

/** GLSL twin of lib/stellarator.ts, generated from the same constants. */
export const skeinGlsl = /* glsl */ `
const float SK_R0 = ${f(SKEIN.majorRadius)};
const float SK_A = ${f(SKEIN.minorRadius)};
const float SK_N = ${f(SKEIN.periods)};
const float SK_E = ${f(SKEIN.elongation)};
const float SK_D = ${f(SKEIN.axisExcursion)};
const float SK_T = ${f(SKEIN.triangularity)};
const float SK_IOTA = ${f(SKEIN.iota)};
const float SK_SHEAR = ${f(SKEIN.iotaShear)};
const float TAU = 6.28318530718;

vec3 skeinPoint(float rho, float theta, float phi) {
  float np = SK_N * phi;
  float a = SK_A * rho;
  float shape = SK_A * min(rho * rho, 1.6) * SK_T;
  float r = SK_R0 + SK_D * cos(np) + a * (cos(theta) + SK_E * cos(theta - np)) + shape * cos(2.0 * theta - np);
  float z = -SK_D * sin(np) + a * (sin(theta) - SK_E * sin(theta - np)) + shape * sin(2.0 * theta - np);
  return vec3(r * cos(phi), z, r * sin(phi));
}

float skeinIota(float rho) {
  return SK_IOTA + SK_SHEAR * rho * rho;
}
`;
