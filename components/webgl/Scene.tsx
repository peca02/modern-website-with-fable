"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { reportLoad, skipSceneLoad } from "@/lib/loadClock";
import { PALETTE } from "@/lib/palette";
import { QUALITY, lowerTier, pickInitialTier, type QualityTier } from "@/lib/quality";
import { emit, store } from "@/lib/store";
import { SceneFallback } from "@/components/SceneFallback";
import { Director } from "@/components/webgl/Director";
import { Effects } from "@/components/webgl/Effects";
import { Machine } from "@/components/webgl/Machine";
import { Particles } from "@/components/webgl/Particles";
import { Plasma } from "@/components/webgl/Plasma";
import { Wordmark } from "@/components/webgl/Wordmark";

type Probe = { supported: false } | { supported: true; tier: QualityTier };

/** `?tier=low|medium|high|ultra` pins the quality tier, for comparing tiers on a real device. */
function requestedTier(): QualityTier | null {
  const value = new URLSearchParams(window.location.search).get("tier");
  return value === "low" || value === "medium" || value === "high" || value === "ultra" ? value : null;
}

function probeDevice(): Probe {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) return { supported: false };
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  const maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE));
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  const memory = "deviceMemory" in navigator && typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : undefined;
  const pinned = requestedTier();
  if (pinned) return { supported: true, tier: pinned };
  return {
    supported: true,
    tier: pickInitialTier({
      renderer,
      maxTextureSize,
      coarsePointer: window.matchMedia("(pointer: coarse)").matches,
      cores: navigator.hardwareConcurrency ?? 4,
      memoryGb: memory,
      viewportWidth: window.innerWidth,
    }),
  };
}

export function Scene() {
  const [probe] = useState(probeDevice);
  const [tier, setTier] = useState<QualityTier>(probe.supported ? probe.tier : "low");
  const [visible, setVisible] = useState(true);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    reportLoad("chunk");
    if (!probe.supported) skipSceneLoad();
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [probe.supported]);

  useEffect(() => {
    store.quality.tier = tier;
    emit("tier");
  }, [tier]);

  if (!probe.supported || lost) return <SceneFallback />;
  const settings = QUALITY[tier];

  return (
    <Canvas
      dpr={[1, settings.dprCap]}
      frameloop={visible ? "always" : "never"}
      camera={{ fov: 36, near: 0.05, far: 120, position: [0, 3, 9.4] }}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" }}
      onCreated={({ gl, scene, camera }) => {
        gl.toneMapping = THREE.NoToneMapping;
        reportLoad("context");
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          store.scene.lost = true;
          setLost(true);
          emit("context-lost");
        });
        gl.compileAsync(scene, camera).then(() => {
          store.scene.ready = true;
          reportLoad("compiled");
          emit("scene-ready");
        });
      }}
    >
      <color attach="background" args={[PALETTE.void]} />
      {requestedTier() ? null : <PerformanceMonitor flipflops={2} onDecline={() => setTier(lowerTier)} />}
      <Director />
      <Plasma segments={settings.surfaceSegments} shellCount={settings.shellCount} />
      <Machine segments={settings.surfaceSegments} coilSegments={settings.coilSegments} />
      <Wordmark />
      <Particles key={settings.particleTextureSize} textureSize={settings.particleTextureSize} />
      <Effects settings={settings} />
    </Canvas>
  );
}
