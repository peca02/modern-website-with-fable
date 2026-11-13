import { hashGlsl, rampGlsl, simplexGlsl } from "@/shaders/noise.glsl";
import { skeinGlsl } from "@/shaders/skein.glsl";

export const SHAPE = { thread: 0, skein: 1, loom: 2 } as const;

export const simVertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const simFragment = /* glsl */ `
precision highp float;
uniform sampler2D uState;
uniform vec2 uResolution;
uniform float uTime;
uniform float uDt;
uniform float uInit;
uniform float uShapeA;
uniform float uShapeB;
uniform float uMix;
uniform float uReveal;
uniform float uSpread;
uniform float uTurbulence;
uniform float uFollow;
uniform float uFlow;
uniform vec3 uPointer;
uniform float uPointerForce;

${skeinGlsl}
${hashGlsl}
${simplexGlsl}

vec3 threadShape(vec4 seed) {
  // One closed field line: 5 toroidal turns, 3 poloidal.
  float phi = seed.y * uReveal * TAU * 5.0;
  float theta = 0.6 * phi;
  vec3 jitter = (seed.xzw - 0.5) * 0.024;
  return skeinPoint(1.0, theta, phi) + jitter;
}

vec3 skeinShape(vec4 seed) {
  float rho = 0.58 + 0.72 * pow(seed.x, 1.7) + uSpread * (0.4 + 3.2 * seed.w * seed.w);
  float phi = seed.y * TAU + uTime * uFlow * (0.5 + seed.w);
  float theta = seed.z * TAU + skeinIota(rho) * phi;
  return skeinPoint(rho, theta, phi);
}

vec3 loomShape(vec4 seed) {
  // The skein unwound: parallel warp threads running across the frame.
  float lane = floor(seed.x * 56.0);
  float travel = fract(seed.y + uTime * uFlow * 0.03 * (0.6 + hash11(lane + 3.0)));
  float x = (travel - 0.5) * 18.0;
  float y = (lane / 55.0 - 0.5) * 2.6 + 0.018 * sin(x * 2.4 + lane);
  float z = (hash11(lane) - 0.5) * 0.9 + (seed.z - 0.5) * 0.02;
  return vec3(x, y, z);
}

vec3 shapeTarget(float shape, vec4 seed) {
  if (shape < 0.5) return threadShape(seed);
  if (shape < 1.5) return skeinShape(seed);
  return loomShape(seed);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec4 seed = hash42(gl_FragCoord.xy);
  vec4 state = texture2D(uState, uv);

  // Each particle leaves for the next shape at its own moment.
  float m = smoothstep(0.0, 1.0, clamp(uMix * 1.6 - seed.z * 0.6, 0.0, 1.0));
  vec3 target = mix(shapeTarget(uShapeA, seed), shapeTarget(uShapeB, seed), m);

  if (uInit > 0.5) {
    gl_FragColor = vec4(target, 0.0);
    return;
  }

  vec3 p = state.xyz;
  vec3 next = p + (target - p) * (1.0 - exp(-uFollow * (0.6 + 0.8 * seed.w) * uDt));
  next += curlNoise(p * 0.5 + uTime * 0.06) * uTurbulence * uDt;

  vec3 away = p - uPointer;
  float falloff = exp(-dot(away, away) / 0.5);
  next += normalize(away + 1e-4) * uPointerForce * falloff * uDt;

  float speed = length(next - p) / max(uDt, 1e-3);
  gl_FragColor = vec4(next, mix(state.w, speed, 0.2));
}
`;

export const particleVertex = /* glsl */ `
uniform sampler2D uState;
uniform sampler2D uPrevious;
uniform float uDt;
uniform float uStreak;
uniform float uPointSize;
uniform float uHeat;
uniform float uPixelRatio;
uniform float uSize;
varying float vHeat;
varying float vFade;

${hashGlsl}

void main() {
  vec4 state = texture2D(uState, position.xy);
  vec4 previous = texture2D(uPrevious, position.xy);
  vec4 seed = hash42(position.xy * uSize);
  vec3 velocity = (state.xyz - previous.xyz) / max(uDt, 1e-3);
  // The tail trails behind the head, so every particle reads as a filament.
  vec3 pos = state.xyz - velocity * position.z * uStreak;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPointSize * uPixelRatio * (0.5 + seed.w) * (6.0 / max(-mv.z, 0.5));
  float core = 1.0 - seed.x;
  vHeat = clamp(0.18 + 0.5 * core * core + uHeat * 0.6 + state.w * 0.06, 0.0, 1.0);
  vFade = (1.0 - position.z * 0.85) * smoothstep(0.2, 1.2, -mv.z);
}
`;

export const particleFragment = /* glsl */ `
precision highp float;
uniform float uAlpha;
uniform float uPoints;
varying float vHeat;
varying float vFade;

${rampGlsl}

void main() {
  float shape = 1.0;
  if (uPoints > 0.5) {
    vec2 c = gl_PointCoord - 0.5;
    shape = smoothstep(0.5, 0.0, length(c));
  }
  gl_FragColor = vec4(heatRamp(vHeat) * uAlpha * vFade * shape, 1.0);
}
`;
