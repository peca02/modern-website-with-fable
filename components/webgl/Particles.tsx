"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { ParticleSystem } from "@/components/webgl/systems/ParticleSystem";

type ParticlesProps = { textureSize: number };

export function Particles({ textureSize }: ParticlesProps) {
  const floatTargets = useThree((state) => state.gl.extensions.has("EXT_color_buffer_float"));
  const [system] = useState(() => new ParticleSystem(textureSize, floatTargets));

  useEffect(() => () => system.dispose(), [system]);

  useFrame((state, delta) => {
    system.update(state.gl, Math.min(delta, 0.05));
  }, -1);

  return <primitive object={system.object} />;
}
