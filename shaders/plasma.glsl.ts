import { rampGlsl, simplexGlsl } from "@/shaders/noise.glsl";
import { skeinGlsl } from "@/shaders/skein.glsl";

/** Shared by every mesh that lies on a flux surface: position.xy carries (theta, phi). */
export const surfaceVertex = /* glsl */ `
uniform float uRho;
uniform float uRound;
varying vec3 vNormal;
varying vec3 vOutward;
varying vec3 vView;
varying vec2 vAngles;

${skeinGlsl}

// uRound 1 swaps the flux surface for a plain torus (the cryostat).
vec3 surfacePoint(float rho, float theta, float phi) {
  if (uRound > 0.5) {
    float r = SK_R0 + SK_A * rho * cos(theta);
    return vec3(r * cos(phi), SK_A * rho * sin(theta), r * sin(phi));
  }
  return skeinPoint(rho, theta, phi);
}

void main() {
  float theta = position.x;
  float phi = position.y;
  vec3 p = surfacePoint(uRho, theta, phi);
  const float e = 0.012;
  vec3 dTheta = surfacePoint(uRho, theta + e, phi) - p;
  vec3 dPhi = surfacePoint(uRho, theta, phi + e) - p;
  vec3 n = normalize(cross(dTheta, dPhi));
  vec3 axis = surfacePoint(0.0, theta, phi);
  if (dot(n, p - axis) < 0.0) n = -n;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vNormal = normalMatrix * n;
  vOutward = n;
  vView = -mv.xyz;
  vAngles = vec2(theta, phi);
  gl_Position = projectionMatrix * mv;
}
`;

const fieldPattern = /* glsl */ `
uniform float uTime;
uniform float uRho;

// Noise that is constant along field lines. The 4/5 pitch closes after one
// toroidal turn, so embedding both angles on circles leaves no seam.
float fieldPattern(vec2 angles, float scale, float drift) {
  float line = angles.x - 0.8 * angles.y;
  vec2 across = vec2(cos(5.0 * line), sin(5.0 * line));
  float along = angles.y - uTime * drift;
  vec2 around = vec2(cos(along), sin(along));
  float coarse = snoise(vec3(across * scale + around * 1.3, uTime * 0.08 + uRho * 3.0));
  float fine = snoise(vec3(across * scale * 3.1 - around * 2.1, uTime * 0.14 - uRho * 5.0));
  return coarse * 0.62 + fine * 0.38;
}
`;

export const shellFragment = /* glsl */ `
precision highp float;
uniform float uIntensity;
uniform float uHeat;
varying vec3 vNormal;
varying vec3 vView;
varying vec2 vAngles;

${simplexGlsl}
${rampGlsl}
${fieldPattern}

void main() {
  float facing = abs(dot(normalize(vNormal), normalize(vView)));
  float rim = pow(1.0 - facing, 1.8);
  float pattern = fieldPattern(vAngles, 1.6, 0.35);
  float strands = smoothstep(0.05, 0.85, pattern);
  float energy = (0.03 + strands * strands * 0.7) * (0.08 + rim);
  gl_FragColor = vec4(heatRamp(0.2 + uHeat * 0.55 + strands * 0.3) * energy * uIntensity, 1.0);
}
`;

export const coreFragment = /* glsl */ `
precision highp float;
uniform float uIntensity;
uniform float uHeat;
varying vec3 vNormal;
varying vec3 vView;
varying vec2 vAngles;

${simplexGlsl}
${rampGlsl}
${fieldPattern}

void main() {
  float facing = abs(dot(normalize(vNormal), normalize(vView)));
  float pattern = fieldPattern(vAngles, 1.1, 0.5);
  float veins = smoothstep(-0.15, 0.8, pattern);
  float limb = pow(1.0 - facing, 2.4);
  float energy = 0.05 + veins * veins * (0.5 + 2.2 * uHeat) + limb * (0.5 + uHeat);
  vec3 color = heatRamp(0.12 + uHeat * 0.6 + veins * 0.35) * energy * uIntensity;
  gl_FragColor = vec4(color, 1.0);
}
`;
