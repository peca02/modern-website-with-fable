"use client";

import dynamic from "next/dynamic";
import { SceneFallback } from "@/components/SceneFallback";
import { skipSceneLoad } from "@/lib/loadClock";

const Scene = dynamic(
  () =>
    import("@/components/webgl/Scene")
      .then((module) => module.Scene)
      .catch(() => {
        // The scene chunk failed to load: release the preloader and show the static art.
        skipSceneLoad();
        return SceneFallback;
      }),
  { ssr: false },
);

export function SceneMount() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-lvh w-full">
      <Scene />
    </div>
  );
}
