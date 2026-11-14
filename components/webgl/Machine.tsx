"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { smoothstep } from "@/lib/math";
import { PALETTE } from "@/lib/palette";
import { SKEIN, skeinPoint, type Vec3Tuple } from "@/lib/stellarator";
import { store } from "@/lib/store";
import { rig } from "@/components/webgl/rig";
import { COIL_RHO, createCoilGeometry } from "@/components/webgl/systems/coilGeometry";
import { createSurfaceGeometry } from "@/components/webgl/systems/surfaceGeometry";
import { machineFragment, partVertex } from "@/shaders/machine.glsl";
import { surfaceVertex } from "@/shaders/plasma.glsl";

type MachineProps = {
  segments: [toroidal: number, poloidal: number];
  coilSegments: number;
};

/*
 * Layers from the plasma outwards. `opensAt` is the cut progress at which the
 * layer starts to open and `width` its final half-angle, so the cutaway steps
 * back like terraces: outer layers open first and widest.
 */
const LAYERS = [
  { key: "wall", rho: 1.2, round: 0, wire: 0, tiles: [18, 150], cold: 0, opensAt: 0.66, width: 0.42 },
  { key: "blanket", rho: 1.42, round: 0, wire: 0, tiles: [10, 60], cold: 0, opensAt: 0.5, width: 0.56 },
  { key: "vessel", rho: 1.64, round: 0, wire: 1, tiles: [12, 100], cold: 0.3, opensAt: 0.34, width: 0.72 },
  { key: "coils", rho: COIL_RHO, round: 0, wire: 0, tiles: [1, 1], cold: 1, opensAt: 0.18, width: 0.9 },
  { key: "cryostat", rho: 3.7, round: 1, wire: 1, tiles: [16, 72], cold: 0.8, opensAt: 0.02, width: 1.1 },
] as const;

const RING_OUTER = 0.14;
const anchorPoint: Vec3Tuple = [0, 0, 0];
const projected = new THREE.Vector3();

function layerCut(index: number, progress: number): number {
  const layer = LAYERS[index];
  return layer.width * smoothstep(layer.opensAt, layer.opensAt + RING_OUTER, progress);
}

function createUniforms(layer: (typeof LAYERS)[number]) {
  return {
    uRho: { value: layer.rho },
    uRound: { value: layer.round },
    uCutCenter: { value: 0 },
    uCutWidth: { value: 0 },
    uPresence: { value: 0 },
    uHeat: { value: 0 },
    uCold: { value: layer.cold },
    uWire: { value: layer.wire },
    uTiles: { value: new THREE.Vector2(layer.tiles[0], layer.tiles[1]) },
    uCryo: { value: new THREE.Color(PALETTE.cryo) },
    uBone: { value: new THREE.Color(PALETTE.bone) },
    uEmber: { value: new THREE.Color(PALETTE.ember) },
    uPlasma: { value: new THREE.Color(PALETTE.plasma) },
    uGlow: { value: new THREE.Color(PALETTE.glow) },
  };
}

export function Machine({ segments, coilSegments }: MachineProps) {
  const [toroidal, poloidal] = segments;
  const surface = useMemo(() => createSurfaceGeometry(Math.round(toroidal * 0.6), Math.round(poloidal * 0.75)), [toroidal, poloidal]);
  const coils = useMemo(() => createCoilGeometry(coilSegments), [coilSegments]);
  const uniforms = useMemo(() => LAYERS.map(createUniforms), []);
  const group = useRef<THREE.Group>(null);

  useEffect(
    () => () => {
      surface.dispose();
      coils.dispose();
    },
    [surface, coils],
  );

  useFrame(({ camera, size }) => {
    const root = group.current;
    if (!root) return;
    const present = rig.machine > 0.001;
    root.visible = present;

    root.children.forEach((child, index) => {
      if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.ShaderMaterial)) return;
      const values = child.material.uniforms;
      values.uCutCenter.value = rig.cutCenter;
      values.uCutWidth.value = layerCut(index, rig.cut);
      // Inner layers arrive first, so the machine builds outwards around the plasma.
      values.uPresence.value = smoothstep(index * 0.12, index * 0.12 + 0.5, rig.machine);
      values.uHeat.value = rig.heat;
    });

    // Label anchors: 0 is the plasma, 1..5 the layers, each at the lip of its own cut.
    for (let anchor = 0; anchor < 6; anchor++) {
      const layerIndex = anchor - 1;
      const side = anchor % 2 === 0 ? 1 : -1;
      if (layerIndex < 0) {
        skeinPoint(1, Math.PI * 0.5, rig.cutCenter, anchorPoint);
      } else {
        const layer = LAYERS[layerIndex];
        const phi = rig.cutCenter + side * (layerCut(layerIndex, rig.cut) + 0.05);
        if (layer.round === 1) {
          const radius = SKEIN.majorRadius;
          const lift = SKEIN.minorRadius * layer.rho;
          anchorPoint[0] = radius * Math.cos(phi);
          anchorPoint[1] = lift;
          anchorPoint[2] = radius * Math.sin(phi);
        } else {
          skeinPoint(layer.rho, Math.PI * (0.3 + layerIndex * 0.09), phi, anchorPoint);
        }
      }
      projected.set(anchorPoint[0], anchorPoint[1], anchorPoint[2]).project(camera);
      const revealed = layerIndex < 0 ? smoothstep(0.78, 0.86, rig.cut) : layerIndex === 4 ? 1 : smoothstep(0, 0.1, layerCut(layerIndex + 1, rig.cut));
      const offset = anchor * 3;
      store.anchors[offset] = (projected.x * 0.5 + 0.5) * size.width;
      store.anchors[offset + 1] = (-projected.y * 0.5 + 0.5) * size.height;
      store.anchors[offset + 2] = present && projected.z < 1 ? revealed * smoothstep(0.6, 1, rig.machine) : 0;
    }
  });

  return (
    <group ref={group} visible={false}>
      {LAYERS.map((layer, index) =>
        layer.key === "coils" ? (
          <mesh key={layer.key} geometry={coils} frustumCulled={false}>
            <shaderMaterial vertexShader={partVertex} fragmentShader={machineFragment} uniforms={uniforms[index]} side={THREE.DoubleSide} />
          </mesh>
        ) : (
          <mesh key={layer.key} geometry={surface} frustumCulled={false}>
            <shaderMaterial vertexShader={surfaceVertex} fragmentShader={machineFragment} uniforms={uniforms[index]} side={THREE.DoubleSide} />
          </mesh>
        ),
      )}
    </group>
  );
}
