import * as THREE from "three";
import { SKEIN, skeinPoint, type Vec3Tuple } from "@/lib/stellarator";

export const COIL_COUNT = 50;
export const COIL_RHO = 1.98;

const point: Vec3Tuple = [0, 0, 0];

function coilPoint(theta: number, phi: number, out: THREE.Vector3): THREE.Vector3 {
  // Non-planar: the winding leans along the torus as it goes around the plasma.
  const lean = 0.05 * Math.sin(2 * theta + SKEIN.periods * phi) + 0.022 * Math.sin(theta - 2 * SKEIN.periods * phi);
  skeinPoint(COIL_RHO, theta, phi + lean, point);
  return out.set(point[0], point[1], point[2]);
}

/** All 50 field coils as one merged mesh of rectangular-section windings. */
export function createCoilGeometry(segments: number): THREE.BufferGeometry {
  const half = { radial: 0.07, toroidal: 0.045 };
  const vertexCount = COIL_COUNT * segments * 4 * 4;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const phis = new Float32Array(vertexCount);
  const arounds = new Float32Array(vertexCount);
  const indices = new Uint32Array(COIL_COUNT * segments * 4 * 6);

  const centre = new THREE.Vector3();
  const next = new THREE.Vector3();
  const axis = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const radial = new THREE.Vector3();
  const side = new THREE.Vector3();
  const corner = new THREE.Vector3();
  const ring: THREE.Vector3[][] = Array.from({ length: segments + 1 }, () => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
  const faceNormals = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const signs: [number, number][] = [[1, 1], [1, -1], [-1, -1], [-1, 1]];

  let v = 0;
  let i = 0;
  for (let coil = 0; coil < COIL_COUNT; coil++) {
    const phi = ((coil + 0.5) / COIL_COUNT) * Math.PI * 2;
    for (let s = 0; s <= segments; s++) {
      const theta = (s / segments) * Math.PI * 2;
      coilPoint(theta, phi, centre);
      coilPoint(theta + 0.01, phi, next);
      skeinPoint(0, 0, phi, point);
      axis.set(point[0], point[1], point[2]);
      tangent.subVectors(next, centre).normalize();
      radial.subVectors(centre, axis);
      radial.addScaledVector(tangent, -radial.dot(tangent)).normalize();
      side.crossVectors(tangent, radial).normalize();
      signs.forEach(([a, b], c) => {
        ring[s][c].copy(centre).addScaledVector(radial, a * half.radial).addScaledVector(side, b * half.toroidal);
      });
    }
    for (let s = 0; s < segments; s++) {
      for (let face = 0; face < 4; face++) {
        const a = ring[s][face];
        const b = ring[s][(face + 1) % 4];
        const c = ring[s + 1][(face + 1) % 4];
        const d = ring[s + 1][face];
        const normal = faceNormals[face];
        normal.subVectors(b, a).cross(corner.subVectors(d, a)).normalize();
        const base = v;
        for (const vertex of [a, b, c, d]) {
          positions[v * 3] = vertex.x;
          positions[v * 3 + 1] = vertex.y;
          positions[v * 3 + 2] = vertex.z;
          normals[v * 3] = normal.x;
          normals[v * 3 + 1] = normal.y;
          normals[v * 3 + 2] = normal.z;
          phis[v] = phi;
          arounds[v] = (s / segments) * Math.PI * 2;
          v++;
        }
        indices[i++] = base;
        indices[i++] = base + 1;
        indices[i++] = base + 2;
        indices[i++] = base;
        indices[i++] = base + 2;
        indices[i++] = base + 3;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("aPhi", new THREE.BufferAttribute(phis, 1));
  geometry.setAttribute("aAround", new THREE.BufferAttribute(arounds, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}
