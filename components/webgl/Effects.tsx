"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, type BloomEffect, type ChromaticAberrationEffect, ToneMappingMode } from "postprocessing";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { QualitySettings } from "@/lib/quality";
import { rig } from "@/components/webgl/rig";

type EffectsProps = { settings: QualitySettings };

export function Effects({ settings }: EffectsProps) {
  const aberration = useRef<ChromaticAberrationEffect>(null);
  const bloom = useRef<BloomEffect>(null);
  const [offset] = useState(() => new THREE.Vector2(0, 0));

  useFrame(() => {
    const effect = aberration.current;
    if (effect) effect.offset.setScalar(0.0006 + rig.aberration * 0.003);
    if (bloom.current) bloom.current.intensity = 0.6 + rig.flash * 2.2;
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {settings.bloom ? <Bloom ref={bloom} mipmapBlur intensity={0.6} luminanceThreshold={0.75} luminanceSmoothing={0.2} radius={0.6} /> : <></>}
      {settings.chromaticAberration ? (
        <ChromaticAberration ref={aberration} offset={offset} radialModulation modulationOffset={0.35} />
      ) : (
        <></>
      )}
      <ToneMapping mode={ToneMappingMode.AGX} />
      {settings.grain ? <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.5} /> : <></>}
      <Vignette offset={0.28} darkness={0.72} />
    </EffectComposer>
  );
}
