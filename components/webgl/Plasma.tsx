"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/palette";
import { rig } from "@/components/webgl/rig";
import { createSurfaceGeometry } from "@/components/webgl/systems/surfaceGeometry";
import { coreFragment, shellFragment, surfaceVertex } from "@/shaders/plasma.glsl";

type PlasmaProps = {
  segments: [toroidal: number, poloidal: number];
  shellCount: number;
};

const CORE_RHO = 0.5;

function paletteUniforms() {
  return {
    uEmber: { value: new THREE.Color(PALETTE.ember) },
    uPlasma: { value: new THREE.Color(PALETTE.plasma) },
    uGlow: { value: new THREE.Color(PALETTE.glow) },
  };
}

export function Plasma({ segments, shellCount }: PlasmaProps) {
  const [toroidal, poloidal] = segments;
  const geometry = useMemo(() => createSurfaceGeometry(toroidal, poloidal), [toroidal, poloidal]);
  const group = useRef<THREE.Group>(null);

  const shells = useMemo(
    () =>
      Array.from({ length: shellCount }, (_, index) => ({
        rho: 0.62 + (index / Math.max(1, shellCount - 1)) * 0.42,
        weight: 1 - index * 0.18,
      })),
    [shellCount],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const root = group.current;
    if (!root) return;
    root.visible = rig.plasma > 0.001;
    root.children.forEach((child) => {
      if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.ShaderMaterial)) return;
      const uniforms = child.material.uniforms;
      const isCore = child.userData.core === true;
      uniforms.uTime.value = rig.time;
      uniforms.uHeat.value = rig.heat;
      uniforms.uIntensity.value = rig.plasma * (isCore ? rig.core : child.userData.weight);
      if (isCore) child.visible = rig.core > 0.001;
    });
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} frustumCulled={false} userData={{ core: true }}>
        <shaderMaterial
          vertexShader={surfaceVertex}
          fragmentShader={coreFragment}
          uniforms={{ uRho: { value: CORE_RHO }, uRound: { value: 0 }, uTime: { value: 0 }, uHeat: { value: 0 }, uIntensity: { value: 0 }, ...paletteUniforms() }}
          side={THREE.DoubleSide}
        />
      </mesh>
      {shells.map((shell) => (
        <mesh key={shell.rho} geometry={geometry} frustumCulled={false} userData={{ weight: shell.weight }} renderOrder={2}>
          <shaderMaterial
            vertexShader={surfaceVertex}
            fragmentShader={shellFragment}
            uniforms={{ uRho: { value: shell.rho }, uRound: { value: 0 }, uTime: { value: 0 }, uHeat: { value: 0 }, uIntensity: { value: 0 }, ...paletteUniforms() }}
            side={THREE.DoubleSide}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
