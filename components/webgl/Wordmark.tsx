"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/palette";
import { SITE } from "@/lib/site";
import { rig } from "@/components/webgl/rig";

const TEXTURE_WIDTH = 2048;
const TEXTURE_HEIGHT = 640;
const PLANE_WIDTH = 7.4;
const PLANE_HEIGHT = (PLANE_WIDTH * TEXTURE_HEIGHT) / TEXTURE_WIDTH;

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// The letters are lit from below by the plasma they stand in.
const fragment = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uOpacity;
uniform float uHeat;
uniform vec3 uBone;
uniform vec3 uPlasma;
varying vec2 vUv;
void main() {
  float ink = texture2D(uMap, vUv).a * uOpacity;
  if (ink < 0.02) discard;
  float lit = smoothstep(0.75, 0.0, vUv.y);
  vec3 color = mix(uBone * 0.34, uPlasma * (0.7 + uHeat), lit * lit);
  gl_FragColor = vec4(color, ink);
}
`;

async function drawWordmark(): Promise<THREE.CanvasTexture | null> {
  // Only the web font itself: asking the FontFaceSet for the metric fallback face rejects.
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-fraunces").split(",")[0].trim() || "serif";
  const font = `100 520px ${family}`;
  await document.fonts.load(font, SITE.name.toUpperCase());
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = "#fff";
  context.letterSpacing = "-10px";
  const text = SITE.name.toUpperCase();
  const scale = Math.min(1, (TEXTURE_WIDTH * 0.96) / context.measureText(text).width);
  context.translate(TEXTURE_WIDTH / 2, TEXTURE_HEIGHT * 0.86);
  context.scale(scale, scale);
  context.fillText(text, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

/** The giant wordmark standing inside the ring: the near arc passes in front of it, the far arc behind. */
export function Wordmark() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const [uniforms] = useState(() => ({
    uMap: { value: null as THREE.Texture | null },
    uOpacity: { value: 0 },
    uHeat: { value: 0 },
    uBone: { value: new THREE.Color(PALETTE.bone) },
    uPlasma: { value: new THREE.Color(PALETTE.plasma) },
  }));

  useEffect(() => {
    let disposed = false;
    let created: THREE.CanvasTexture | null = null;
    drawWordmark().then((result) => {
      if (disposed) {
        result?.dispose();
        return;
      }
      created = result;
      setTexture(result);
    });
    return () => {
      disposed = true;
      created?.dispose();
    };
  }, []);

  useFrame(({ camera }) => {
    const plane = mesh.current;
    const shader = material.current;
    if (!plane || !shader) return;
    plane.visible = texture !== null && rig.wordmark > 0.001;
    if (!plane.visible) return;
    shader.uniforms.uMap.value = texture;
    shader.uniforms.uOpacity.value = rig.wordmark;
    shader.uniforms.uHeat.value = rig.heat;
    plane.rotation.y = Math.atan2(camera.position.x, camera.position.z);
  });

  return (
    <mesh ref={mesh} position={[0, PLANE_HEIGHT * 0.5 - 0.42, 0]} visible={false} renderOrder={1}>
      <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
      <shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}
