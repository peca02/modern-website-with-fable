import * as THREE from "three";

/**
 * Everything the director decides for the current frame. Scene systems read it
 * inside useFrame; nothing here is React state.
 */
export const rig = {
  cameraPosition: new THREE.Vector3(0, 3, 9.4),
  cameraTarget: new THREE.Vector3(0, 0.1, 0),
  fov: 36,
  shapeA: 0,
  shapeB: 1,
  mix: 0,
  reveal: 0,
  spread: 0,
  turbulence: 0,
  follow: 3,
  flow: 0.12,
  streak: 0.05,
  particleAlpha: 1,
  pointer: new THREE.Vector3(0, 0, 50),
  pointerForce: 0,
  heat: 0.3,
  plasma: 0,
  core: 0,
  machine: 0,
  cut: 0,
  cutCenter: 0,
  wordmark: 0,
  bloom: 1,
  aberration: 0,
  time: 0,
};
