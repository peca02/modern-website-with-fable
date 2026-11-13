"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/components/webgl/Scene").then((module) => module.Scene), {
  ssr: false,
});

export function SceneMount() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-lvh w-full">
      <Scene />
    </div>
  );
}
