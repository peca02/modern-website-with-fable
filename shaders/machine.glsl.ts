import { hashGlsl, rampGlsl } from "@/shaders/noise.glsl";

/** Vertex shader for meshes built on the CPU (the coils). aPhi: toroidal angle of the part. */
export const partVertex = /* glsl */ `
attribute float aPhi;
attribute float aAround;
varying vec3 vNormal;
varying vec3 vOutward;
varying vec3 vView;
varying vec2 vAngles;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalMatrix * normal;
  vOutward = normal;
  vView = -mv.xyz;
  vAngles = vec2(aAround, aPhi);
  gl_Position = projectionMatrix * mv;
}
`;

/**
 * Dark engineered surfaces lit from two sides: the plasma inside (warm) and the
 * cold hall outside (cryo rim). A wedge facing the camera is cut away.
 */
export const machineFragment = /* glsl */ `
precision highp float;
uniform float uCutCenter;
uniform float uCutWidth;
uniform float uPresence;
uniform float uHeat;
uniform float uCold;
uniform float uWire;
uniform vec2 uTiles;
uniform vec3 uCryo;
uniform vec3 uBone;
varying vec3 vNormal;
varying vec3 vOutward;
varying vec3 vView;
varying vec2 vAngles;

const float TAU = 6.28318530718;

${hashGlsl}
${rampGlsl}

void main() {
  float offset = vAngles.y - uCutCenter;
  float angular = abs(atan(sin(offset), cos(offset)));
  if (angular < uCutWidth) discard;

  // Panels arrive one by one while the machine assembles.
  vec2 tile = floor(vec2(vAngles.x, vAngles.y) / TAU * uTiles);
  float order = hash11(tile.x * 17.0 + tile.y * 131.0 + 3.0);
  if (order > uPresence * 1.4 - 0.2) discard;
  float arrival = smoothstep(0.0, 0.25, uPresence * 1.4 - 0.2 - order);

  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  float facing = dot(n, v);
  bool inner = facing < 0.0;
  facing = abs(facing);

  vec2 grid = vec2(vAngles.x, vAngles.y) / TAU * uTiles;
  vec2 cell = fract(grid);
  vec2 toLine = min(cell, 1.0 - cell) / max(fwidth(grid), 1e-5);
  float seam = 1.0 - smoothstep(0.4, 1.4, min(toLine.x, toLine.y));

  vec3 color;
  if (uWire > 0.5) {
    // Outer shells are drawn as hairline cages so the layers inside stay readable.
    if (seam < 0.05 && angular > uCutWidth + 0.02) discard;
    color = mix(uCryo, uBone, 0.3) * seam * (0.05 + 0.3 * pow(1.0 - facing, 2.0)) * (inner ? 0.5 : 1.0);
  } else {
    vec3 metal = mix(vec3(0.004, 0.0045, 0.005), vec3(0.02, 0.021, 0.023), facing);
    float key = max(dot(normalize(vOutward), normalize(vec3(-0.4, 0.8, 0.45))), 0.0);
    color = metal + uBone * key * 0.012;
    color += uCryo * pow(1.0 - facing, 3.0) * (0.03 + 0.22 * uCold) * (inner ? 0.0 : 1.0);
    color += heatRamp(0.25 + uHeat * 0.4) * (0.02 + 0.1 * facing * facing) * (inner ? 1.0 : 0.0) * (1.0 - uCold);
    color += mix(uBone, uCryo, uCold) * seam * 0.02;
  }

  float edge = smoothstep(uCutWidth + 0.02, uCutWidth, angular) * step(0.001, uCutWidth);
  color += heatRamp(0.75) * edge * 0.9 * (1.0 - uCold) + uCryo * edge * 0.6 * uCold;
  color += heatRamp(0.9) * (1.0 - arrival) * 0.6;

  gl_FragColor = vec4(color, 1.0);
}
`;
