import * as THREE from "three";

/**
 * A (theta, phi) grid. The vertex shader lifts it onto a flux surface, so one
 * geometry serves the plasma core, its shells and every machine layer.
 */
export function createSurfaceGeometry(toroidal: number, poloidal: number): THREE.BufferGeometry {
  const columns = toroidal + 1;
  const rows = poloidal + 1;
  const angles = new Float32Array(columns * rows * 3);
  let offset = 0;
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      angles[offset++] = (j / poloidal) * Math.PI * 2;
      angles[offset++] = (i / toroidal) * Math.PI * 2;
      angles[offset++] = 0;
    }
  }
  const indices = new Uint32Array(toroidal * poloidal * 6);
  offset = 0;
  for (let i = 0; i < toroidal; i++) {
    for (let j = 0; j < poloidal; j++) {
      const a = i * rows + j;
      const b = a + rows;
      indices[offset++] = a;
      indices[offset++] = b;
      indices[offset++] = a + 1;
      indices[offset++] = b;
      indices[offset++] = b + 1;
      indices[offset++] = a + 1;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(angles, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}
